import type { ListingEvent, PriceHistory } from '../../shared/domain';
import { processListingObservation, reconcileMissing } from '../lifecycle/service';
import type { CrawlRunInput, ListingObservation } from '../lifecycle/types';
import { ListingLifecycleStore } from '../lifecycle/store';
import { PRODUCTION_SCOPE } from '../scope/production';
export const refreshProductionScope = PRODUCTION_SCOPE;

export type SourceStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED';
export interface SourceResult {
  sourceId: string;
  status: SourceStatus;
  observations: ListingObservation[];
  errorMessage?: string;
}
export interface RefreshResult {
  status: SourceStatus;
  sources: SourceResult[];
  listings: number;
  histories: number;
  events: number;
}
export interface RefreshOptions {
  runId: string;
  startedAt: string;
  finishedAt: string;
  store: ListingLifecycleStore;
}

export function aggregateStatus(results: SourceResult[]): SourceStatus {
  return results.length > 0 && results.every((result) => result.status === 'SUCCESS')
    ? 'SUCCESS'
    : results.some((result) => result.status === 'SUCCESS' || result.status === 'PARTIAL')
      ? 'PARTIAL'
      : 'FAILED';
}

export function runRefresh(results: SourceResult[], options: RefreshOptions): RefreshResult {
  const status = aggregateStatus(results);
  let histories = 0;
  let events = 0;
  for (const result of results) {
    for (const observation of result.observations) {
      const lifecycle = processListingObservation(options.store, observation);
      if (lifecycle.priceHistory) histories += 1;
      events += lifecycle.events.length;
    }
    const run: CrawlRunInput = {
      id: `${options.runId}:${result.sourceId}`,
      sourceId: result.sourceId,
      startedAt: options.startedAt,
      finishedAt: options.finishedAt,
      status: result.status,
      listingCount: result.observations.length,
      errorMessage: result.errorMessage,
    };
    reconcileMissing(options.store, run, new Set(result.observations.map((item) => item.id)));
  }
  return {
    status,
    sources: results,
    listings: options.store.listAll().length,
    histories,
    events,
  };
}

export type RefreshPublication = (input: {
  listings: ReturnType<ListingLifecycleStore['listAll']>;
  histories: PriceHistory[];
  events: ListingEvent[];
}) => Promise<void>;
