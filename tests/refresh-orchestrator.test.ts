import { describe, expect, it } from 'vitest';
import { aggregateStatus, runRefresh, type SourceResult } from '../crawler/refresh/orchestrator';
import { ListingLifecycleStore } from '../crawler/lifecycle/store';
import type { ListingObservation } from '../crawler/lifecycle/types';

const observation: ListingObservation = {
  id: '591-sale:fixture-1',
  sourceId: '591-sale',
  sourceListingId: 'fixture-1',
  listingType: 'USED',
  title: 'Fixture',
  contentHash: 'content',
  rawDataHash: 'raw',
  totalPrice: 10_000_000,
  observedAt: '2026-08-24T08:20:00+08:00',
};
const source = (
  status: SourceResult['status'],
  observations: ListingObservation[] = [observation],
): SourceResult => ({ sourceId: '591-sale', status, observations });

describe('refresh orchestrator', () => {
  it('aggregates all-success only when every source succeeds', () => {
    expect(aggregateStatus([source('SUCCESS'), { ...source('SUCCESS'), sourceId: 'moi' }])).toBe(
      'SUCCESS',
    );
    expect(aggregateStatus([source('SUCCESS'), { ...source('FAILED'), sourceId: 'moi' }])).toBe(
      'PARTIAL',
    );
    expect(aggregateStatus([source('FAILED'), { ...source('FAILED'), sourceId: 'moi' }])).toBe(
      'FAILED',
    );
  });
  it('does not advance missing lifecycle for partial source results', () => {
    const store = new ListingLifecycleStore();
    runRefresh([source('SUCCESS')], {
      runId: 'a',
      startedAt: observation.observedAt,
      finishedAt: observation.observedAt,
      store,
    });
    const result = runRefresh([source('PARTIAL', [])], {
      runId: 'b',
      startedAt: observation.observedAt,
      finishedAt: observation.observedAt,
      store,
    });
    expect(result.status).toBe('PARTIAL');
    expect(store.getListing(observation.id)?.status).toBe('ACTIVE');
    expect(store.getListing(observation.id)?.missingSuccessCount).toBe(0);
    store.close();
  });
  it('does not advance missing lifecycle for failed source results', () => {
    const store = new ListingLifecycleStore();
    runRefresh([source('SUCCESS')], {
      runId: 'a',
      startedAt: observation.observedAt,
      finishedAt: observation.observedAt,
      store,
    });
    const result = runRefresh([{ ...source('FAILED', []), errorMessage: 'upstream unavailable' }], {
      runId: 'b',
      startedAt: observation.observedAt,
      finishedAt: observation.observedAt,
      store,
    });
    expect(result.status).toBe('FAILED');
    expect(store.getListing(observation.id)?.status).toBe('ACTIVE');
    expect(store.getListing(observation.id)?.missingSuccessCount).toBe(0);
    store.close();
  });
});
