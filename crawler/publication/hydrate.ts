import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  listingEventSchema,
  listingSchema,
  priceHistorySchema,
  transactionSchema,
} from '../../shared/schemas';
import { ListingLifecycleStore } from '../lifecycle/store';
import { createTransactionRepository } from '../persistence/sqlite';

const valueAfter = (args: string[], name: string): string | undefined => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

async function readNdjson<T>(file: string, parse: (value: unknown) => T): Promise<T[]> {
  const text = await fs.readFile(file, 'utf8');
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => parse(JSON.parse(line)));
}

export async function hydratePublishedData(
  inputDir: string,
  databasePath: string,
): Promise<{ listings: number; histories: number; events: number; transactions: number }> {
  const listings = listingSchema
    .array()
    .parse(JSON.parse(await fs.readFile(path.join(inputDir, 'listings', 'all.json'), 'utf8')));
  const histories = await readNdjson(path.join(inputDir, 'history', 'price.ndjson'), (value) =>
    priceHistorySchema.parse(value),
  );
  const events = await readNdjson(path.join(inputDir, 'history', 'events.ndjson'), (value) =>
    listingEventSchema.parse(value),
  );
  const transactionsFile = path.join(inputDir, 'transactions', 'all.json');
  let transactions = [] as ReturnType<typeof transactionSchema.array.parse>;
  try {
    transactions = transactionSchema
      .array()
      .parse(JSON.parse(await fs.readFile(transactionsFile, 'utf8')));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const store = new ListingLifecycleStore(databasePath);
  const repository = createTransactionRepository(databasePath);
  try {
    for (const listing of listings) store.saveListing(listing);
    for (const history of histories) store.savePriceHistory(history);
    for (const event of events) store.saveEvent(event);
    for (const transaction of transactions) repository.upsert(transaction);
  } finally {
    repository.close();
    store.close();
  }
  return {
    listings: listings.length,
    histories: histories.length,
    events: events.length,
    transactions: transactions.length,
  };
}

const input = valueAfter(process.argv.slice(2), '--input') ?? 'public/data';
const database = valueAfter(process.argv.slice(2), '--db');
if (!database)
  throw new Error('Usage: npm run data:hydrate -- --input <public/data> --db <canonical.sqlite>');
console.log(JSON.stringify(await hydratePublishedData(input, database)));
