import Database from 'better-sqlite3';
import type { Listing, ListingEvent, PriceHistory, RawSnapshot } from '../../shared/domain';
import type { CrawlRunInput } from './types';

export class ListingLifecycleStore {
  readonly db: Database.Database;
  constructor(filename = ':memory:') { this.db = new Database(filename); this.db.exec(`PRAGMA user_version = 2;
    CREATE TABLE IF NOT EXISTS listings (id TEXT PRIMARY KEY, source_id TEXT NOT NULL, source_listing_id TEXT NOT NULL, status TEXT NOT NULL, payload_json TEXT NOT NULL, UNIQUE(source_id, source_listing_id));
    CREATE TABLE IF NOT EXISTS listing_price_history (id TEXT PRIMARY KEY, listing_id TEXT NOT NULL, observed_at TEXT NOT NULL, payload_json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS listing_events (id TEXT PRIMARY KEY, listing_id TEXT NOT NULL, event_type TEXT NOT NULL, occurred_at TEXT NOT NULL, payload_json TEXT NOT NULL, UNIQUE(listing_id, event_type, occurred_at));
    CREATE TABLE IF NOT EXISTS raw_snapshots (id TEXT PRIMARY KEY, listing_id TEXT NOT NULL, crawled_at TEXT NOT NULL, raw_hash TEXT NOT NULL, payload_json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS crawl_runs (id TEXT PRIMARY KEY, source_id TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT, status TEXT NOT NULL, listing_count INTEGER, error_message TEXT);`); }
  getListing(id: string): Listing | undefined { const row = this.db.prepare('SELECT payload_json FROM listings WHERE id=?').get(id) as { payload_json: string } | undefined; return row ? JSON.parse(row.payload_json) as Listing : undefined; }
  listBySource(sourceId: string): Listing[] { return (this.db.prepare('SELECT payload_json FROM listings WHERE source_id=?').all(sourceId) as { payload_json: string }[]).map((row) => JSON.parse(row.payload_json) as Listing); }
  count(table: 'listings' | 'listing_price_history' | 'listing_events' | 'raw_snapshots'): number { return (this.db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count; }
  events(listingId: string): ListingEvent[] { return (this.db.prepare('SELECT payload_json FROM listing_events WHERE listing_id=? ORDER BY occurred_at').all(listingId) as { payload_json: string }[]).map((row) => JSON.parse(row.payload_json) as ListingEvent); }
  histories(listingId: string): PriceHistory[] { return (this.db.prepare('SELECT payload_json FROM listing_price_history WHERE listing_id=? ORDER BY observed_at').all(listingId) as { payload_json: string }[]).map((row) => JSON.parse(row.payload_json) as PriceHistory); }
  snapshots(listingId: string): RawSnapshot[] { return (this.db.prepare('SELECT payload_json FROM raw_snapshots WHERE listing_id=? ORDER BY crawled_at').all(listingId) as { payload_json: string }[]).map((row) => JSON.parse(row.payload_json) as RawSnapshot); }
  saveListing(listing: Listing): void { this.db.prepare('INSERT INTO listings (id,source_id,source_listing_id,status,payload_json) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,payload_json=excluded.payload_json').run(listing.id, listing.sourceId, listing.sourceListingId, listing.status, JSON.stringify(listing)); }
  saveEvent(event: ListingEvent): void { this.db.prepare('INSERT OR IGNORE INTO listing_events (id,listing_id,event_type,occurred_at,payload_json) VALUES (?,?,?,?,?)').run(event.id, event.listingId, event.eventType, event.occurredAt, JSON.stringify(event)); }
  savePriceHistory(history: PriceHistory): void { this.db.prepare('INSERT OR IGNORE INTO listing_price_history (id,listing_id,observed_at,payload_json) VALUES (?,?,?,?)').run(history.id, history.listingId, history.observedAt, JSON.stringify(history)); }
  saveSnapshot(snapshot: RawSnapshot): void { this.db.prepare('INSERT OR IGNORE INTO raw_snapshots (id,listing_id,crawled_at,raw_hash,payload_json) VALUES (?,?,?,?,?)').run(snapshot.id, snapshot.sourceListingId, snapshot.crawledAt, snapshot.rawHash, JSON.stringify(snapshot)); }
  saveCrawlRun(run: CrawlRunInput): void { this.db.prepare('INSERT OR REPLACE INTO crawl_runs (id,source_id,started_at,finished_at,status,listing_count,error_message) VALUES (?,?,?,?,?,?,?)').run(run.id, run.sourceId, run.startedAt, run.finishedAt, run.status, run.listingCount ?? null, run.errorMessage ?? null); }
  close(): void { this.db.close(); }
}
