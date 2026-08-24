import type { Listing, ListingEvent, PriceHistory } from '../../shared/domain';

export type ListingObservation = Omit<Listing, 'createdAt' | 'updatedAt' | 'firstSeenAt' | 'lastSeenAt' | 'lastCheckedAt' | 'status' | 'missingSince' | 'delistedAt' | 'relistCount' | 'missingSuccessCount'> & { observedAt: string };
export interface LifecycleResult { listing: Listing; events: ListingEvent[]; priceHistory?: PriceHistory; snapshotSaved: boolean; }
export interface CrawlRunInput { id: string; sourceId: string; startedAt: string; finishedAt: string; status: 'SUCCESS' | 'PARTIAL' | 'FAILED'; listingCount?: number; errorMessage?: string; }
