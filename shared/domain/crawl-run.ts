import type { CrawlRunStatus } from './enums';

export interface CrawlRun { id: string; sourceId: string; startedAt: string; finishedAt?: string; status: CrawlRunStatus; listingCount?: number; errorMessage?: string; }
export interface RawSnapshot { id?: string; sourceId: string; sourceListingId: string; crawledAt: string; rawHash: string; rawPayload: unknown; }
