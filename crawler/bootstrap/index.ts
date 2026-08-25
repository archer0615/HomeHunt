import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { ListingObservation } from '../lifecycle/types';
import { ListingLifecycleStore } from '../lifecycle/store';
import { processListingObservation } from '../lifecycle/service';
import { createTransactionRepository } from '../persistence/sqlite';
import { publicationInputFromStores, publishData } from '../publication';
import type { SourceResult } from '../refresh/orchestrator';
import { parseCsvBytes } from '../collectors/moi/parser';
import { normalizeMoi } from '../collectors/moi/normalizer';
import { PRODUCTION_SCOPE } from '../scope/production';

export const REQUIRED_SOURCES = ['moi', '591-sale', '591-newhouse'] as const;
export const ACTIVE_BASELINE_FILE = 'active-baseline.json';

export interface BootstrapSourceResult extends SourceResult {
  transactions?: ReturnType<typeof normalizeMoi>[];
}

export interface BootstrapCandidateSummary {
  bootstrapId: string;
  generatedAt: string;
  promotable: boolean;
  sources: Record<string, { status: SourceResult['status']; records: number }>;
  validation: {
    status: 'PASS' | 'FAIL';
    duplicateListingIds: number;
    fatalErrors: number;
    listingCount: number;
    transactionCount: number;
  };
  publication: {
    status: 'PASS' | 'FAIL';
    appDataVersion?: string;
    schemaVersion?: number;
  };
  diagnostics: {
    listingTypes: Record<string, number>;
    nullTotalPriceRatio: number;
    nullUnitPriceRatio: number;
    nullBuildingAreaRatio: number;
  };
}

export interface BootstrapCandidateResult {
  bootstrapId: string;
  candidateDir: string;
  summary: BootstrapCandidateSummary;
}
export const bootstrapProductionScope = PRODUCTION_SCOPE;

const stableId = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 12);

function sourceSummary(results: BootstrapSourceResult[]): BootstrapCandidateSummary['sources'] {
  return Object.fromEntries(
    results.map((result) => [
      result.sourceId,
      {
        status: result.status,
        records: result.observations.length + (result.transactions?.length ?? 0),
      },
    ]),
  );
}

function diagnostics(listings: ReturnType<ListingLifecycleStore['listAll']>) {
  const listingTypes = Object.fromEntries(
    ['USED', 'NEW', 'PRESALE', 'UNKNOWN'].map((type) => [
      type,
      listings.filter((listing) => listing.listingType === type).length,
    ]),
  );
  const ratio = (count: number) => (listings.length ? count / listings.length : 0);
  return {
    listingTypes,
    nullTotalPriceRatio: ratio(
      listings.filter((listing) => listing.totalPrice === undefined).length,
    ),
    nullUnitPriceRatio: ratio(listings.filter((listing) => listing.unitPrice === undefined).length),
    nullBuildingAreaRatio: ratio(
      listings.filter((listing) => listing.buildingArea === undefined).length,
    ),
  };
}

export async function buildBootstrapCandidate(options: {
  bootstrapId?: string;
  candidateRoot: string;
  results: BootstrapSourceResult[];
  scope?: typeof PRODUCTION_SCOPE;
}): Promise<BootstrapCandidateResult> {
  const scope = options.scope ?? PRODUCTION_SCOPE;
  if (scope !== PRODUCTION_SCOPE) throw new Error('bootstrap requires the production scope');
  const bootstrapId = options.bootstrapId ?? `bootstrap-${Date.now()}-${stableId(options.results)}`;
  const candidateDir = path.resolve(options.candidateRoot, bootstrapId);
  const databasePath = path.join(candidateDir, 'canonical.sqlite');
  const publicationDir = path.join(candidateDir, 'publication');
  await fs.rm(candidateDir, { recursive: true, force: true });
  await fs.mkdir(candidateDir, { recursive: true });

  const store = new ListingLifecycleStore(databasePath);
  const transactionRepository = createTransactionRepository(databasePath);
  let duplicateListingIds = 0;
  let fatalErrors = 0;
  try {
    const seen = new Set<string>();
    for (const result of options.results) {
      for (const observation of result.observations) {
        if (seen.has(observation.id)) {
          duplicateListingIds += 1;
          continue;
        }
        seen.add(observation.id);
        try {
          processListingObservation(store, observation);
        } catch {
          fatalErrors += 1;
        }
      }
      for (const transaction of result.transactions ?? [])
        transactionRepository.upsert(transaction);
    }

    const input = {
      ...publicationInputFromStores(store, transactionRepository),
      sources: options.results.map((result) => ({
        sourceId: result.sourceId,
        status: result.status,
        lastAttemptAt: new Date().toISOString(),
        itemCount: result.observations.length + (result.transactions?.length ?? 0),
      })),
    };
    const requiredSuccess = REQUIRED_SOURCES.every(
      (sourceId) =>
        options.results.find((result) => result.sourceId === sourceId)?.status === 'SUCCESS',
    );
    const validationPass =
      requiredSuccess &&
      input.listings.length > 0 &&
      input.transactions.length > 0 &&
      duplicateListingIds === 0 &&
      fatalErrors === 0;
    let publicationResult: Awaited<ReturnType<typeof publishData>> | undefined;
    let publicationStatus: 'PASS' | 'FAIL' = 'FAIL';
    if (validationPass) {
      try {
        publicationResult = await publishData(input, { targetDir: publicationDir });
        publicationStatus = 'PASS';
      } catch {
        fatalErrors += 1;
      }
    }
    const summary: BootstrapCandidateSummary = {
      bootstrapId,
      generatedAt: new Date().toISOString(),
      promotable: validationPass && publicationStatus === 'PASS',
      sources: sourceSummary(options.results),
      validation: {
        status: validationPass ? 'PASS' : 'FAIL',
        duplicateListingIds,
        fatalErrors,
        listingCount: input.listings.length,
        transactionCount: input.transactions.length,
      },
      publication: {
        status: publicationStatus,
        appDataVersion: publicationResult?.appDataVersion,
        schemaVersion: 1,
      },
      diagnostics: diagnostics(input.listings),
    };
    await fs.writeFile(
      path.join(candidateDir, 'bootstrap-summary.json'),
      JSON.stringify(summary, null, 2) + '\n',
    );
    await fs.writeFile(
      path.join(candidateDir, 'validation-report.json'),
      JSON.stringify(summary.validation, null, 2) + '\n',
    );
    return { bootstrapId, candidateDir, summary };
  } finally {
    transactionRepository.close();
    store.close();
  }
}

async function copyDirectory(source: string, target: string): Promise<void> {
  await fs.cp(source, target, { recursive: true });
}

export async function promoteBootstrapCandidate(options: {
  candidateDir: string;
  dataRoot: string;
  publicationRoot: string;
}): Promise<void> {
  const candidateDir = path.resolve(options.candidateDir);
  const summary = JSON.parse(
    await fs.readFile(path.join(candidateDir, 'bootstrap-summary.json'), 'utf8'),
  ) as BootstrapCandidateSummary;
  const markerPath = path.join(options.dataRoot, ACTIVE_BASELINE_FILE);
  if (
    summary.promotable !== true ||
    summary.validation.status !== 'PASS' ||
    summary.publication.status !== 'PASS'
  )
    throw new Error('promotion refused: candidate is not promotable');
  try {
    await fs.access(markerPath);
    throw new Error('promotion refused: active baseline already exists');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const publicationMetadata = JSON.parse(
    await fs.readFile(path.join(candidateDir, 'publication', 'metadata.json'), 'utf8'),
  ) as { appDataVersion?: string };
  if (publicationMetadata.appDataVersion !== summary.publication.appDataVersion)
    throw new Error('promotion refused: appDataVersion mismatch');
  const canonicalSource = path.join(candidateDir, 'canonical.sqlite');
  await fs.access(canonicalSource);
  await fs.mkdir(options.dataRoot, { recursive: true });
  await fs.mkdir(path.dirname(options.publicationRoot), { recursive: true });
  const canonicalTarget = path.join(options.dataRoot, 'canonical.sqlite');
  const publicationTarget = options.publicationRoot;
  for (const target of [canonicalTarget, publicationTarget]) {
    try {
      await fs.access(target);
      throw new Error(`promotion refused: target already exists (${target})`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  const canonicalStage = `${canonicalTarget}.bootstrap-${summary.bootstrapId}`;
  const publicationStage = `${publicationTarget}.bootstrap-${summary.bootstrapId}`;
  await fs.rm(canonicalStage, { force: true });
  await fs.rm(publicationStage, { recursive: true, force: true });
  let activated = false;
  try {
    await fs.copyFile(canonicalSource, canonicalStage);
    await copyDirectory(path.join(candidateDir, 'publication'), publicationStage);
    await fs.rename(canonicalStage, canonicalTarget);
    await fs.rename(publicationStage, publicationTarget);
    await fs.writeFile(
      markerPath,
      JSON.stringify(
        { bootstrapId: summary.bootstrapId, appDataVersion: summary.publication.appDataVersion },
        null,
        2,
      ) + '\n',
    );
    activated = true;
  } finally {
    if (!activated) {
      await fs.rm(canonicalStage, { force: true });
      await fs.rm(publicationStage, { recursive: true, force: true });
      await fs.rm(canonicalTarget, { force: true });
      await fs.rm(publicationTarget, { recursive: true, force: true });
    }
  }
}

export function fixtureBootstrapResults(csv: string, observedAt: string): BootstrapSourceResult[] {
  const transactionRows = parseCsvBytes(new TextEncoder().encode(csv), 'fixture.csv');
  return [
    {
      sourceId: 'moi',
      status: 'SUCCESS',
      observations: [],
      transactions: transactionRows.map(normalizeMoi),
    },
    {
      sourceId: '591-sale',
      status: 'SUCCESS',
      observations: [
        {
          id: '591-sale:fixture-1',
          sourceId: '591-sale',
          sourceListingId: 'fixture-1',
          listingType: 'USED',
          title: 'Fixture Sale',
          totalPrice: 12_000_000,
          unitPrice: 500_000,
          buildingArea: 24,
          observedAt,
          contentHash: 'fixture-sale-content',
          rawDataHash: 'fixture-sale-raw',
        } as ListingObservation,
      ],
    },
    {
      sourceId: '591-newhouse',
      status: 'SUCCESS',
      observations: [
        {
          id: '591-newhouse:fixture-1',
          sourceId: '591-newhouse',
          sourceListingId: 'fixture-1',
          listingType: 'PRESALE',
          title: 'Fixture NewHouse',
          minTotalPrice: 10_000_000,
          maxTotalPrice: 12_000_000,
          minBuildingArea: 20,
          maxBuildingArea: 25,
          observedAt,
          contentHash: 'fixture-newhouse-content',
          rawDataHash: 'fixture-newhouse-raw',
        } as ListingObservation,
      ],
    },
  ];
}
