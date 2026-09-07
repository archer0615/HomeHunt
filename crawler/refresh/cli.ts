import { promises as fs } from 'node:fs';
import path from 'node:path';
import { collectNewHousePages } from '../collectors/591-newhouse/collector';
import { newHouseSourceConfig } from '../collectors/591-newhouse/config';
import { normalizeNewHouse } from '../collectors/591-newhouse/normalizer';
import type { Raw591NewHouseListing } from '../collectors/591-newhouse/types';
import { collectSalePages } from '../collectors/591-sale/collector';
import { saleSourceConfig } from '../collectors/591-sale/config';
import { normalizeSale } from '../collectors/591-sale/normalizer';
import type { Raw591SaleListing } from '../collectors/591-sale/types';
import { yungchingSaleSourceConfig } from '../collectors/yungching-sale/config';
import { collectYungchingPages } from '../collectors/yungching-sale/collector';
import { normalizeYungchingSale } from '../collectors/yungching-sale/normalizer';
import type { RawYungchingSaleListing } from '../collectors/yungching-sale/types';
import { sinyiSaleSourceConfig } from '../collectors/sinyi-sale/config';
import { collectSinyiPages } from '../collectors/sinyi-sale/collector';
import { normalizeSinyiSale } from '../collectors/sinyi-sale/normalizer';
import { parseSinyiHtml } from '../collectors/sinyi-sale/parser';
import { buildSinyiSaleRequest } from '../collectors/sinyi-sale/request';
import { buildYungchingSaleRequest } from '../collectors/yungching-sale/request';
import { parseYungchingHtml } from '../collectors/yungching-sale/parser';
import { moiConfig } from '../collectors/moi/config';
import { discoverCsvFiles, downloadMoiArchive } from '../collectors/moi/downloader';
import { runMoiCsvPipeline } from '../pipeline/moi';
import { ListingLifecycleStore } from '../lifecycle/store';
import { createTransactionRepository } from '../persistence/sqlite';
import { hydratePublishedData } from '../publication/hydrate';
import { publicationInputFromStores, publishData } from '../publication';
import { runRefresh, type SourceResult } from './orchestrator';

const fixture = process.argv.includes('--fixture');
const candidateMode = process.argv.includes('--candidate');
const dataDir = path.resolve('public/data');
const startedAt = new Date().toISOString();
const runId = `refresh-${startedAt.replace(/[-:.TZ]/g, '')}`;
const runRoot = candidateMode
  ? path.resolve('data/refresh-candidates', runId)
  : path.resolve('data');
const databasePath = path.join(runRoot, 'canonical.sqlite');
const baselineMarker = path.resolve('data/active-baseline.json');

async function fetchJsonPage(
  url: string,
  page: number,
  timeoutMs: number,
  maxRetries: number,
): Promise<unknown> {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}page=${page}`, {
        signal: controller.signal,
        headers: { accept: 'application/json' },
      });
      if (response.status === 403) throw new Error('ACCESS_DENIED');
      if (response.status === 429) {
        if (attempt === maxRetries) throw new Error('RATE_LIMITED');
        await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
        continue;
      }
      if (!response.ok) throw new Error(`HTTP_ERROR:${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error('RATE_LIMITED');
}

async function fetchHtmlPage(url: string, page: number, timeoutMs: number, maxRetries: number): Promise<string> {
  const request = new URL(url);
  if (page > 1) request.searchParams.set('pg', String(page));
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(request, { signal: controller.signal, headers: { accept: 'text/html' } });
      if (response.status === 403) throw new Error('ACCESS_DENIED');
      if (response.status === 429) { if (attempt === maxRetries) throw new Error('RATE_LIMITED'); await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt)); continue; }
      if (!response.ok) throw new Error(`HTTP_ERROR:${response.status}`);
      return await response.text();
    } finally { clearTimeout(timeout); }
  }
  throw new Error('RATE_LIMITED');
}

function sourceFailure(sourceId: string, error: unknown): SourceResult {
  return {
    sourceId,
    status: 'FAILED',
    observations: [],
    errorMessage: error instanceof Error ? error.message : 'SOURCE_ERROR',
  };
}

async function collectSale(): Promise<SourceResult> {
  if (!saleSourceConfig.liveCollectionEnabled) {
    return sourceFailure(
      saleSourceConfig.sourceId,
      'LIVE_COLLECTION_PAUSED: response contract not confirmed',
    );
  }
  try {
    const result = await collectSalePages(
      (page) =>
        fetchJsonPage(
          saleSourceConfig.baseUrl,
          page,
          saleSourceConfig.timeoutMs,
          saleSourceConfig.maxRetries,
        ),
      saleSourceConfig.maxPages,
    );
    return {
      sourceId: saleSourceConfig.sourceId,
      status: result.status,
      observations: result.items.map((item: Raw591SaleListing) => normalizeSale(item, startedAt)),
      errorMessage: result.errors.join('; '),
    };
  } catch (error) {
    return sourceFailure(saleSourceConfig.sourceId, error);
  }
}

async function collectNewHouse(): Promise<SourceResult> {
  if (!newHouseSourceConfig.liveCollectionEnabled) {
    return sourceFailure(
      newHouseSourceConfig.sourceId,
      'LIVE_COLLECTION_PAUSED: response contract not confirmed',
    );
  }
  try {
    const result = await collectNewHousePages(
      (page) =>
        fetchJsonPage(
          newHouseSourceConfig.baseUrl,
          page,
          newHouseSourceConfig.timeoutMs,
          newHouseSourceConfig.maxRetries,
        ),
      newHouseSourceConfig.maxPages,
    );
    return {
      sourceId: newHouseSourceConfig.sourceId,
      status: result.status,
      observations: result.items.map((item: Raw591NewHouseListing) =>
        normalizeNewHouse(item, startedAt),
      ),
      errorMessage: result.errors.join('; '),
    };
  } catch (error) {
    return sourceFailure(newHouseSourceConfig.sourceId, error);
  }
}

async function collectYungching(): Promise<SourceResult> {
  if (!yungchingSaleSourceConfig.liveCollectionEnabled) return sourceFailure(yungchingSaleSourceConfig.sourceId, 'LIVE_COLLECTION_PAUSED: public response contract not confirmed');
  try {
    const cityResults = await Promise.all((['臺北市', '新北市'] as const).map((city) => collectYungchingPages(async (page) => {
      const parsed = parseYungchingHtml(await fetchHtmlPage(buildYungchingSaleRequest(city, page).url, page, yungchingSaleSourceConfig.timeoutMs, yungchingSaleSourceConfig.maxRetries), page);
      if (parsed.status === 'FAILED') throw new Error(parsed.errors.join('; '));
      return parsed.items;
    }, yungchingSaleSourceConfig.maxPages)));
    const result = { status: cityResults.some((item) => item.status === 'PARTIAL') ? 'PARTIAL' as const : cityResults.some((item) => item.status === 'FAILED') ? 'FAILED' as const : 'SUCCESS' as const, items: cityResults.flatMap((item) => item.items), errors: cityResults.flatMap((item) => item.errors), warnings: cityResults.flatMap((item) => item.warnings) };
    return { sourceId: yungchingSaleSourceConfig.sourceId, status: result.status, observations: result.items.map((item: RawYungchingSaleListing) => normalizeYungchingSale(item, startedAt)), errorMessage: result.errors.join('; ') };
  } catch (error) { return sourceFailure(yungchingSaleSourceConfig.sourceId, error); }
}

async function collectSinyi(): Promise<SourceResult> {
  if (!sinyiSaleSourceConfig.liveCollectionEnabled) return sourceFailure(sinyiSaleSourceConfig.sourceId, 'LIVE_COLLECTION_PAUSED: public response contract not confirmed');
  try { const results = await Promise.all((['臺北市', '新北市'] as const).map((city) => collectSinyiPages(async (page) => { const parsed = parseSinyiHtml(await fetchHtmlPage(buildSinyiSaleRequest(city, page).url, page, sinyiSaleSourceConfig.timeoutMs, sinyiSaleSourceConfig.maxRetries), page); if (parsed.status === 'FAILED') throw new Error(parsed.errors.join('; ')); return parsed.items; }, sinyiSaleSourceConfig.maxPages))); const observations = results.flatMap((result) => result.items).map((item) => normalizeSinyiSale(item, startedAt)); return { sourceId: sinyiSaleSourceConfig.sourceId, status: results.some((result) => result.status === 'PARTIAL') ? 'PARTIAL' as const : results.some((result) => result.status === 'FAILED') ? 'FAILED' as const : 'SUCCESS' as const, observations, errorMessage: results.flatMap((result) => result.errors).join('; ') }; } catch (error) { return sourceFailure(sinyiSaleSourceConfig.sourceId, error); }
}

async function collectMoi(database: string): Promise<SourceResult> {
  try {
    const files = discoverCsvFiles(await downloadMoiArchive(moiConfig));
    const repository = createTransactionRepository(database);
    try {
      for (const [file, bytes] of Object.entries(files))
        runMoiCsvPipeline(bytes, file, repository, { referenceDate: startedAt });
    } finally {
      repository.close();
    }
    return { sourceId: moiConfig.sourceId, status: 'SUCCESS', observations: [] };
  } catch (error) {
    return sourceFailure(moiConfig.sourceId, error);
  }
}

async function runFixture(): Promise<void> {
  const store = new ListingLifecycleStore();
  try {
    const result = runRefresh(
      ['moi', '591-sale', '591-newhouse', 'yungching-sale', 'sinyi-sale'].map((sourceId) => ({
        sourceId,
        status: 'SUCCESS' as const,
        observations: [],
      })),
      {
        runId: 'fixture-refresh',
        startedAt: '2026-08-24T08:20:00+08:00',
        finishedAt: '2026-08-24T08:20:00+08:00',
        store,
      },
    );
    console.log(JSON.stringify({ ...result, mode: 'fixture' }));
  } finally {
    store.close();
  }
}

async function runProduction(): Promise<void> {
  await fs.access(path.join(dataDir, 'metadata.json'));
  await fs.access(baselineMarker);
  await fs.mkdir(path.dirname(databasePath), { recursive: true });
  await hydratePublishedData(dataDir, databasePath);
  const lifecycleStore = new ListingLifecycleStore(databasePath);
  const transactionRepository = createTransactionRepository(databasePath);
  try {
    const previousInput = publicationInputFromStores(lifecycleStore, transactionRepository);
    const moiResult = await collectMoi(databasePath);
    const results = [
      moiResult,
      ...(await Promise.all([
        collectSale(),
        collectNewHouse(),
        collectYungching(),
        collectSinyi(),
      ])),
    ];
    const refresh = runRefresh(results, {
      runId,
      startedAt,
      finishedAt: new Date().toISOString(),
      store: lifecycleStore,
    });
    if (refresh.status === 'FAILED') throw new Error('refresh failed: all sources failed');
    const input = {
      ...publicationInputFromStores(lifecycleStore, transactionRepository),
      sources: results.map((result) => ({
        sourceId: result.sourceId,
        status: result.status,
        lastAttemptAt: startedAt,
        itemCount: result.observations.length,
      })),
    };
    const publicationTarget = candidateMode ? path.join(runRoot, 'publication') : dataDir;
    const publication = await publishData(input, { targetDir: publicationTarget, previousInput });
    console.log(
      JSON.stringify({
        runId,
        startedAt,
        finishedAt: new Date().toISOString(),
        sources: results,
        aggregateStatus: refresh.status,
        lifecycleAdvanced: refresh.events > 0 || refresh.histories > 0,
        publication,
        candidate: candidateMode ? runId : undefined,
        canonicalPersistence: publication.changed,
      }),
    );
  } finally {
    transactionRepository.close();
    lifecycleStore.close();
  }
}

if (fixture) await runFixture();
else await runProduction();
