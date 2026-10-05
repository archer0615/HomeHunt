import { describe, expect, it } from 'vitest';
import type { Listing } from '../shared/domain';
import { decisionScore, findPossibleDuplicates } from '../src/search/decision';
import { searchListings } from '../src/search/engine';

const listing = (id: string, sourceId: string, values: Partial<Listing> = {}): Listing => ({
  id,
  sourceId,
  sourceListingId: id,
  listingType: 'USED',
  city: '臺北市',
  district: '大安區',
  address: '復興南路一段 100 號',
  totalPrice: 20_000_000,
  buildingArea: 30,
  rooms: 3,
  floor: 5,
  status: 'ACTIVE',
  firstSeenAt: '2026-01-01T00:00:00.000Z',
  lastSeenAt: '2026-01-01T00:00:00.000Z',
  lastCheckedAt: '2026-01-01T00:00:00.000Z',
  relistCount: 0,
  missingSuccessCount: 0,
  contentHash: id,
  rawDataHash: id,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...values,
});

describe('local decision and duplicate review', () => {
  it('scores and orders listings by the enabled search range and returns no score without criteria', () => {
    const lower = listing('lower', '591-sale', { totalPrice: 10_000_000 });
    const higher = listing('higher', '591-newhouse', { totalPrice: 24_000_000 });
    const criteria = { totalPrice: { max: 30_000_000 } };
    expect(decisionScore(lower, criteria)).toBeGreaterThan(decisionScore(higher, criteria)!);
    expect(decisionScore(lower, {})).toBeUndefined();
    expect(searchListings([higher, lower], criteria, 'BEST_MATCH').map((item) => item.id)).toEqual([
      'lower',
      'higher',
    ]);
    expect(searchListings([higher, lower], {}, 'BEST_MATCH').map((item) => item.id)).toEqual([
      'higher',
      'lower',
    ]);
  });

  it('suggests cross-source duplicates only when address and available identity fields agree', () => {
    const first = listing('one', '591-sale');
    const sameAddress = listing('two', '591-newhouse', {
      address: '復興南路一段100號',
      buildingArea: 30.5,
    });
    const differentFloor = listing('three', 'moi', { floor: 8 });
    const sameSource = listing('four', '591-sale');
    const noAddress = listing('five', 'moi', { address: undefined });
    const suggestions = findPossibleDuplicates([
      first,
      sameAddress,
      differentFloor,
      sameSource,
      noAddress,
    ]);
    expect(suggestions.get(first.id)?.map((item) => item.id)).toEqual(['two']);
    expect(suggestions.has(differentFloor.id)).toBe(false);
    expect(suggestions.has(noAddress.id)).toBe(false);
  });
});
