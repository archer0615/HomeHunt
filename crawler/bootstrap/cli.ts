import { promises as fs } from 'node:fs';
import path from 'node:path';
import { buildBootstrapCandidate, fixtureBootstrapResults } from './index';
import type { BootstrapSourceResult } from './index';
import type { ListingObservation } from '../lifecycle/types';
import { collectSalePages } from '../collectors/591-sale/collector';
import { saleSourceConfig } from '../collectors/591-sale/config';
import { normalizeSale } from '../collectors/591-sale/normalizer';
import type { Raw591SaleListing } from '../collectors/591-sale/types';
import { collectNewHousePages } from '../collectors/591-newhouse/collector';
import { newHouseSourceConfig } from '../collectors/591-newhouse/config';
import { normalizeNewHouse } from '../collectors/591-newhouse/normalizer';
import type { Raw591NewHouseListing } from '../collectors/591-newhouse/types';
import { moiConfig } from '../collectors/moi/config';
import { discoverCsvFiles, downloadMoiArchive } from '../collectors/moi/downloader';
import { normalizeMoiArchive } from '../pipeline/moi';
import { PRODUCTION_SCOPE } from '../scope/production';
import { presaleRegistryConfig } from '../collectors/moi-presale-registry/config';
import { collectPresaleProjects } from '../collectors/moi-presale-registry/collector';
import { collectYungchingPages } from '../collectors/yungching-sale/collector';
import { yungchingSaleSourceConfig } from '../collectors/yungching-sale/config';
import { normalizeYungchingSale } from '../collectors/yungching-sale/normalizer';
import { parseYungchingHtml } from '../collectors/yungching-sale/parser';
import { buildYungchingSaleRequest } from '../collectors/yungching-sale/request';
import { collectSinyiPages } from '../collectors/sinyi-sale/collector';
import { sinyiSaleSourceConfig } from '../collectors/sinyi-sale/config';
import { normalizeSinyiSale } from '../collectors/sinyi-sale/normalizer';
import { parseSinyiHtml } from '../collectors/sinyi-sale/parser';
import { buildSinyiSaleRequest } from '../collectors/sinyi-sale/request';

const fixture = process.argv.includes('--fixture');
const observedAt = new Date().toISOString();

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

function failed(
  sourceId: BootstrapSourceResult['sourceId'],
  error: unknown,
): BootstrapSourceResult {
  return {
    sourceId,
    status: 'FAILED',
    observations: [],
    transactions: [],
    errorMessage: error instanceof Error ? error.message : 'SOURCE_ERROR',
  };
}

async function fetchHtmlPage(
  url: string,
  page: number,
  timeoutMs: number,
  maxRetries: number,
): Promise<string> {
  const request = new URL(url);
  if (page > 1) request.searchParams.set('pg', String(page));
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(request, {
        signal: controller.signal,
        headers: { accept: 'text/html' },
      });
      if (response.status === 403) throw new Error('ACCESS_DENIED');
      if (response.status === 429) {
        if (attempt === maxRetries) throw new Error('RATE_LIMITED');
        await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
        continue;
      }
      if (!response.ok) throw new Error(`HTTP_ERROR:${response.status}`);
      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error('RATE_LIMITED');
}

async function collectLiveSale(): Promise<BootstrapSourceResult> {
  if (!saleSourceConfig.liveCollectionEnabled)
    return failed('591-sale', 'LIVE_COLLECTION_PAUSED: response contract not confirmed');
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
    const observations = result.items
      .filter(
        (item) => isProductionCity(item.city) && isProductionDistrict(item.city, item.district),
      )
      .map((item: Raw591SaleListing) => normalizeSale(item, observedAt) as ListingObservation);
    return {
      sourceId: '591-sale',
      status: result.status,
      observations,
      errorMessage: result.errors.join('; '),
    };
  } catch (error) {
    return failed('591-sale', error);
  }
}

async function collectLiveNewHouse(): Promise<BootstrapSourceResult> {
  if (!newHouseSourceConfig.liveCollectionEnabled)
    return failed('591-newhouse', 'LIVE_COLLECTION_PAUSED: response contract not confirmed');
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
    const observations = result.items
      .filter(
        (item) => isProductionCity(item.city) && isProductionDistrict(item.city, item.district),
      )
      .map(
        (item: Raw591NewHouseListing) => normalizeNewHouse(item, observedAt) as ListingObservation,
      );
    return {
      sourceId: '591-newhouse',
      status: result.status,
      observations,
      errorMessage: result.errors.join('; '),
    };
  } catch (error) {
    return failed('591-newhouse', error);
  }
}

async function collectLiveMoi(): Promise<BootstrapSourceResult> {
  try {
    const files = discoverCsvFiles(await downloadMoiArchive(moiConfig));
    return {
      sourceId: 'moi',
      status: 'SUCCESS',
      observations: [],
      transactions: normalizeMoiArchive(files, observedAt),
    };
  } catch (error) {
    return failed('moi', error);
  }
}

async function collectLiveYungching(): Promise<BootstrapSourceResult> {
  if (!yungchingSaleSourceConfig.liveCollectionEnabled) return failed(yungchingSaleSourceConfig.sourceId, 'LIVE_COLLECTION_PAUSED: public response contract not confirmed');
  try { const results = await Promise.all((['臺北市', '新北市'] as const).map((city) => collectYungchingPages(async (page) => { const parsed = parseYungchingHtml(await fetchHtmlPage(buildYungchingSaleRequest(city, page).url, page, yungchingSaleSourceConfig.timeoutMs, yungchingSaleSourceConfig.maxRetries), page); if (parsed.status === 'FAILED') throw new Error(parsed.errors.join('; ')); return parsed.items; }, yungchingSaleSourceConfig.maxPages))); const observations = results.flatMap((result) => result.items).filter((item) => isProductionCity(item.city) && isProductionDistrict(item.city, item.district)).map((item) => normalizeYungchingSale(item, observedAt) as ListingObservation); return { sourceId: yungchingSaleSourceConfig.sourceId, status: results.some((result) => result.status === 'PARTIAL') ? 'PARTIAL' : results.some((result) => result.status === 'FAILED') ? 'FAILED' : 'SUCCESS', observations, errorMessage: results.flatMap((result) => result.errors).join('; ') }; } catch (error) { return failed(yungchingSaleSourceConfig.sourceId, error); }
}

async function collectLiveSinyi(): Promise<BootstrapSourceResult> {
  if (!sinyiSaleSourceConfig.liveCollectionEnabled) return failed(sinyiSaleSourceConfig.sourceId, 'LIVE_COLLECTION_PAUSED: public response contract not confirmed');
  try { const results = await Promise.all((['臺北市', '新北市'] as const).map((city) => collectSinyiPages(async (page) => { const parsed = parseSinyiHtml(await fetchHtmlPage(buildSinyiSaleRequest(city, page).url, page, sinyiSaleSourceConfig.timeoutMs, sinyiSaleSourceConfig.maxRetries), page); if (parsed.status === 'FAILED') throw new Error(parsed.errors.join('; ')); return parsed.items; }, sinyiSaleSourceConfig.maxPages))); const observations = results.flatMap((result) => result.items).filter((item) => isProductionCity(item.city) && isProductionDistrict(item.city, item.district)).map((item) => normalizeSinyiSale(item, observedAt) as ListingObservation); return { sourceId: sinyiSaleSourceConfig.sourceId, status: results.some((result) => result.status === 'PARTIAL') ? 'PARTIAL' : results.some((result) => result.status === 'FAILED') ? 'FAILED' : 'SUCCESS', observations, errorMessage: results.flatMap((result) => result.errors).join('; ') }; } catch (error) { return failed(sinyiSaleSourceConfig.sourceId, error); }
}

let result;
if (fixture) {
  const csv = await fs.readFile(path.resolve('tests/fixtures/moi/transactions.csv'), 'utf8');
  result = await buildBootstrapCandidate({
    candidateRoot: path.resolve('data/bootstrap'),
    bootstrapId: 'fixture-bootstrap',
    results: fixtureBootstrapResults(csv, '2026-08-25T00:00:00.000Z'),
    scope: PRODUCTION_SCOPE,
  });
} else {
  const [moiResult, saleResult, newHouseResult] = await Promise.all([
    collectLiveMoi(),
    collectLiveSale(),
    collectLiveNewHouse(),
  ]);
  let presaleProjects = [];
  try {
    presaleProjects = await collectPresaleProjects(
      presaleRegistryConfig.downloadUrl,
      fetch,
      observedAt,
    );
  } catch (error) {
    console.error(
      `moi-presale-registry: ${error instanceof Error ? error.message : 'SOURCE_ERROR'}`,
    );
  }
  const [yungchingResult, sinyiResult] = await Promise.all([
    collectLiveYungching(),
    collectLiveSinyi(),
  ]);
  const results = [moiResult, saleResult, newHouseResult, yungchingResult, sinyiResult];
  result = await buildBootstrapCandidate({
    candidateRoot: path.resolve('data/bootstrap'),
    bootstrapId: `live-${observedAt.replace(/[-:.TZ]/g, '')}`,
    results,
    presaleProjects,
    scope: PRODUCTION_SCOPE,
  });
}
console.log(JSON.stringify(result.summary, null, 2));
