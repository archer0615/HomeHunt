import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Listing, ListingEvent, PriceHistory, Transaction } from '../../shared/domain';
import {
  listingEventSchema,
  listingSchema,
  priceHistorySchema,
  transactionSchema,
} from '../../shared/schemas';

export const PUBLICATION_SCHEMA_VERSION = 1;

export interface PublicationSourceStatus {
  sourceId: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'UNKNOWN';
  lastSuccessfulRunAt?: string;
  lastAttemptAt?: string;
  itemCount: number;
}

export interface PublicationInput {
  listings: Listing[];
  priceHistory: PriceHistory[];
  listingEvents: ListingEvent[];
  transactions: Transaction[];
  sources?: PublicationSourceStatus[];
}

export interface PublicationOptions {
  targetDir: string;
  stagingDir?: string;
  schemaVersion?: number;
  generatedAt?: string;
  previousInput?: PublicationInput;
  allowEmpty?: boolean;
  anomalyGuard?: { minimumPreviousCount: number; maximumDropRatio: number };
}

export interface PublicationResult {
  appDataVersion: string;
  generatedAt: string;
  counts: { listings: number; priceHistory: number; listingEvents: number; transactions: number };
  changed: boolean;
}

const sortRecords = <T extends Record<string, unknown>>(records: T[], keys: (keyof T)[]) =>
  [...records].sort((a, b) =>
    keys
      .map((key) => String(a[key] ?? ''))
      .join('\u0000')
      .localeCompare(keys.map((key) => String(b[key] ?? '')).join('\u0000')),
  );

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

function validateInput(input: PublicationInput, allowEmpty: boolean): void {
  if (!allowEmpty && input.listings.length === 0 && input.transactions.length === 0)
    throw new Error('publication rejected: empty canonical dataset');
  const listingIds = new Set<string>();
  for (const listing of input.listings) {
    listingSchema.parse(listing);
    if (listingIds.has(listing.id))
      throw new Error(`publication rejected: duplicate listing id ${listing.id}`);
    listingIds.add(listing.id);
  }
  for (const history of input.priceHistory) {
    priceHistorySchema.parse(history);
    if (!listingIds.has(history.listingId))
      throw new Error(`publication rejected: unknown history listing ${history.listingId}`);
  }
  for (const event of input.listingEvents) {
    listingEventSchema.parse(event);
    if (!listingIds.has(event.listingId))
      throw new Error(`publication rejected: unknown event listing ${event.listingId}`);
  }
  for (const transaction of input.transactions) transactionSchema.parse(transaction);
  for (const source of input.sources ?? [])
    if (source.itemCount < 0 || !Number.isFinite(source.itemCount))
      throw new Error(`publication rejected: invalid source count ${source.sourceId}`);
}

function dataForHash(input: PublicationInput, schemaVersion: number): unknown {
  return {
    schemaVersion,
    listings: sortRecords(input.listings as unknown as Record<string, unknown>[], ['id']),
    priceHistory: sortRecords(input.priceHistory as unknown as Record<string, unknown>[], [
      'listingId',
      'observedAt',
      'id',
    ]),
    listingEvents: sortRecords(input.listingEvents as unknown as Record<string, unknown>[], [
      'listingId',
      'occurredAt',
      'id',
    ]),
    transactions: sortRecords(input.transactions as unknown as Record<string, unknown>[], ['id']),
  };
}

function ndjson<T>(records: T[]): string {
  return records.length ? records.map(stableJson).join('\n') + '\n' : '';
}

async function writeDataset(
  dir: string,
  input: PublicationInput,
  metadata: Record<string, unknown>,
): Promise<void> {
  await fs.mkdir(path.join(dir, 'listings'), { recursive: true });
  await fs.mkdir(path.join(dir, 'history'), { recursive: true });
  await fs.mkdir(path.join(dir, 'transactions'), { recursive: true });
  const listings = sortRecords(input.listings as unknown as Record<string, unknown>[], ['id']);
  const history = sortRecords(input.priceHistory as unknown as Record<string, unknown>[], [
    'listingId',
    'observedAt',
    'id',
  ]);
  const events = sortRecords(input.listingEvents as unknown as Record<string, unknown>[], [
    'listingId',
    'occurredAt',
    'id',
  ]);
  const transactions = sortRecords(input.transactions as unknown as Record<string, unknown>[], [
    'id',
  ]);
  await Promise.all([
    fs.writeFile(path.join(dir, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n'),
    fs.writeFile(path.join(dir, 'listings', 'all.json'), JSON.stringify(listings, null, 2) + '\n'),
    fs.writeFile(path.join(dir, 'history', 'price.ndjson'), ndjson(history)),
    fs.writeFile(path.join(dir, 'history', 'events.ndjson'), ndjson(events)),
    fs.writeFile(
      path.join(dir, 'transactions', 'all.json'),
      JSON.stringify(transactions, null, 2) + '\n',
    ),
  ]);
}

async function validatePublished(dir: string): Promise<void> {
  const metadata = JSON.parse(await fs.readFile(path.join(dir, 'metadata.json'), 'utf8')) as Record<
    string,
    unknown
  >;
  if (
    typeof metadata.schemaVersion !== 'number' ||
    typeof metadata.appDataVersion !== 'string' ||
    typeof metadata.generatedAt !== 'string'
  )
    throw new Error('published metadata is invalid');
  JSON.parse(await fs.readFile(path.join(dir, 'listings', 'all.json'), 'utf8'));
  JSON.parse(await fs.readFile(path.join(dir, 'transactions', 'all.json'), 'utf8'));
  for (const file of ['price.ndjson', 'events.ndjson'])
    for (const line of (await fs.readFile(path.join(dir, 'history', file), 'utf8'))
      .split('\n')
      .filter(Boolean))
      JSON.parse(line);
}

export async function publishData(
  input: PublicationInput,
  options: PublicationOptions,
): Promise<PublicationResult> {
  const schemaVersion = options.schemaVersion ?? PUBLICATION_SCHEMA_VERSION;
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  validateInput(input, options.allowEmpty ?? false);
  const previousCount = options.previousInput?.listings.length ?? 0;
  const guard = options.anomalyGuard ?? { minimumPreviousCount: 100, maximumDropRatio: 0.8 };
  if (
    previousCount >= guard.minimumPreviousCount &&
    input.listings.length < previousCount * (1 - guard.maximumDropRatio)
  )
    throw new Error(
      `publication rejected: listing anomaly (${previousCount} -> ${input.listings.length})`,
    );
  const digest = createHash('sha256')
    .update(stableJson(dataForHash(input, schemaVersion)))
    .digest('hex');
  const appDataVersion = `sha256-${digest}`;
  const metadata = {
    schemaVersion,
    appDataVersion,
    generatedAt,
    counts: {
      listings: input.listings.length,
      priceHistory: input.priceHistory.length,
      listingEvents: input.listingEvents.length,
      transactions: input.transactions.length,
    },
    sources: input.sources ?? [],
  };
  const target = path.resolve(options.targetDir);
  const staging = path.resolve(options.stagingDir ?? `${target}.staging-${process.pid}`);
  const backup = `${target}.previous-${process.pid}`;
  await fs.rm(staging, { recursive: true, force: true });
  await writeDataset(staging, input, metadata);
  await validatePublished(staging);
  let changed = true;
  try {
    changed =
      stableJson(JSON.parse(await fs.readFile(path.join(target, 'metadata.json'), 'utf8'))) !==
      stableJson(metadata);
  } catch {
    /* first publication */
  }
  if (changed) {
    try {
      await fs.rename(target, backup);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    try {
      await fs.rename(staging, target);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'EPERM') throw error;
      await fs.cp(staging, target, { recursive: true });
      await fs.rm(staging, { recursive: true, force: true });
    }
    await fs.rm(backup, { recursive: true, force: true });
  } else await fs.rm(staging, { recursive: true, force: true });
  return { appDataVersion, generatedAt, counts: metadata.counts, changed };
}
