import type { Listing, ListingEvent, PriceHistory, RawSnapshot } from '../../shared/domain';
import type { CrawlRunInput, LifecycleResult, ListingObservation } from './types';
import { ListingLifecycleStore } from './store';

const eventId = (listingId: string, type: string, at: string) => `${listingId}:${type}:${at}`;
const price = (listing: Listing | ListingObservation) => listing.totalPrice;
const changed = (oldValue: unknown, newValue: unknown) => oldValue !== newValue;

export function processListingObservation(
  store: ListingLifecycleStore,
  observation: ListingObservation,
): LifecycleResult {
  const existing = store.getListing(observation.id);
  const at = observation.observedAt;
  const events: ListingEvent[] = [];
  let history: PriceHistory | undefined;
  let current: Listing;
  const snapshot: RawSnapshot = {
    id: `${observation.id}:${observation.rawDataHash}`,
    sourceId: observation.sourceId,
    sourceListingId: observation.id,
    crawledAt: at,
    rawHash: observation.rawDataHash,
    rawPayload: observation,
  };
  const previousSnapshots = store.snapshots(observation.id);
  const snapshotSaved = !previousSnapshots.some((item) => item.rawHash === observation.rawDataHash);
  if (!existing) {
    current = {
      ...observation,
      status: 'ACTIVE',
      firstSeenAt: at,
      lastSeenAt: at,
      lastCheckedAt: at,
      missingSince: undefined,
      delistedAt: undefined,
      relistCount: 0,
      missingSuccessCount: 0,
      createdAt: at,
      updatedAt: at,
    };
    events.push({
      id: eventId(current.id, 'LISTING_DISCOVERED', at),
      listingId: current.id,
      eventType: 'LISTING_DISCOVERED',
      occurredAt: at,
    });
    if (price(current) !== undefined)
      history = {
        id: `${current.id}:price:${at}`,
        listingId: current.id,
        totalPrice: current.totalPrice,
        unitPrice: current.unitPrice,
        parkingPrice: current.parkingPrice,
        observedAt: at,
      };
  } else {
    current = {
      ...existing,
      ...observation,
      firstSeenAt: existing.firstSeenAt,
      lastSeenAt: at,
      lastCheckedAt: at,
      createdAt: existing.createdAt,
      updatedAt: at,
      status: existing.status,
      missingSince: existing.missingSince,
      delistedAt: existing.delistedAt,
      relistCount: existing.relistCount,
      missingSuccessCount: existing.missingSuccessCount,
    };
    if (existing.status === 'MISSING') {
      current.status = 'ACTIVE';
      current.missingSince = undefined;
      current.missingSuccessCount = 0;
      events.push({
        id: eventId(current.id, 'RESTORED', at),
        listingId: current.id,
        eventType: 'RESTORED',
        occurredAt: at,
      });
    }
    if (existing.status === 'DELISTED') {
      current.status = 'ACTIVE';
      current.delistedAt = undefined;
      current.missingSince = undefined;
      current.missingSuccessCount = 0;
      current.relistCount = existing.relistCount + 1;
      events.push({
        id: eventId(current.id, 'RELISTED', at),
        listingId: current.id,
        eventType: 'RELISTED',
        occurredAt: at,
      });
    }
    const oldPrice = price(existing);
    const newPrice = price(observation);
    if (oldPrice !== undefined && newPrice !== undefined && oldPrice !== newPrice) {
      history = {
        id: `${current.id}:price:${at}`,
        listingId: current.id,
        totalPrice: newPrice,
        unitPrice: current.unitPrice,
        parkingPrice: current.parkingPrice,
        observedAt: at,
      };
      const type = newPrice < oldPrice ? 'PRICE_DECREASED' : 'PRICE_INCREASED';
      events.push({
        id: eventId(current.id, type, at),
        listingId: current.id,
        eventType: type,
        occurredAt: at,
        oldValue: oldPrice,
        newValue: newPrice,
      });
    }
    if (
      existing.contentHash !== observation.contentHash &&
      changed(existing.rawDataHash, observation.rawDataHash)
    )
      events.push({
        id: eventId(current.id, 'CONTENT_CHANGED', at),
        listingId: current.id,
        eventType: 'CONTENT_CHANGED',
        occurredAt: at,
      });
    if (oldPrice === undefined && newPrice !== undefined)
      history = history ?? {
        id: `${current.id}:price:${at}`,
        listingId: current.id,
        totalPrice: newPrice,
        unitPrice: current.unitPrice,
        parkingPrice: current.parkingPrice,
        observedAt: at,
      };
    if (newPrice === undefined) {
      current.totalPrice = existing.totalPrice;
      current.unitPrice = existing.unitPrice;
      current.parkingPrice = existing.parkingPrice;
    }
  }
  const transaction = store.db.transaction(() => {
    store.saveListing(current);
    for (const event of events) store.saveEvent(event);
    if (history) store.savePriceHistory(history);
    if (snapshotSaved) {
      store.saveSnapshot(snapshot);
      const snapshots = store.snapshots(current.id);
      for (const old of snapshots.slice(0, -5))
        store.db.prepare('DELETE FROM raw_snapshots WHERE id=?').run(old.id);
    }
  });
  transaction();
  return { listing: current, events, priceHistory: history, snapshotSaved };
}

export function reconcileMissing(
  store: ListingLifecycleStore,
  run: CrawlRunInput,
  observedIds: Set<string>,
): void {
  store.saveCrawlRun(run);
  if (run.status !== 'SUCCESS') return;
  const transaction = store.db.transaction(() => {
    for (const listing of store.listBySource(run.sourceId)) {
      if (observedIds.has(listing.id) || listing.status === 'DELISTED') continue;
      const next = {
        ...listing,
        status:
          listing.status === 'MISSING'
            ? listing.missingSuccessCount + 1 >= 3
              ? 'DELISTED'
              : 'MISSING'
            : 'MISSING',
        missingSuccessCount: listing.missingSuccessCount + 1,
        missingSince: listing.missingSince ?? run.finishedAt,
        delistedAt: listing.missingSuccessCount + 1 >= 3 ? run.finishedAt : listing.delistedAt,
        lastCheckedAt: run.finishedAt,
        updatedAt: run.finishedAt,
      } as Listing;
      store.saveListing(next);
      if (listing.status === 'ACTIVE')
        store.saveEvent({
          id: eventId(listing.id, 'MARKED_MISSING', run.finishedAt),
          listingId: listing.id,
          eventType: 'MARKED_MISSING',
          occurredAt: run.finishedAt,
        });
      if (next.status === 'DELISTED')
        store.saveEvent({
          id: eventId(listing.id, 'DELISTED', run.finishedAt),
          listingId: listing.id,
          eventType: 'DELISTED',
          occurredAt: run.finishedAt,
        });
    }
  });
  transaction();
}
