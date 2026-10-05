import { describe, expect, it } from 'vitest';
import type { Listing, Transaction } from '../shared/domain';
import {
  addCompareId,
  compareIdsFromUrl,
  findComparableTransactions,
} from '../src/search/market-reference';

const listing: Listing = {
  id: 'listing-1',
  sourceId: '591-sale',
  sourceListingId: '1',
  listingType: 'USED',
  city: '臺北市',
  district: '大安區',
  buildingArea: 30,
  status: 'ACTIVE',
  firstSeenAt: '2026-01-01T00:00:00.000Z',
  lastSeenAt: '2026-01-01T00:00:00.000Z',
  lastCheckedAt: '2026-01-01T00:00:00.000Z',
  relistCount: 0,
  missingSuccessCount: 0,
  contentHash: 'a',
  rawDataHash: 'a',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const transaction = (id: string, overrides: Partial<Transaction> = {}): Transaction => ({
  id,
  sourceId: 'moi',
  transactionType: 'USED',
  city: '臺北市',
  district: '大安區',
  transactionDate: '2025-01-01T00:00:00.000Z',
  buildingArea: 31,
  totalPrice: 20_000_000,
  createdAt: '2025-01-02T00:00:00.000Z',
  ...overrides,
});

describe('market reference and compare URL state', () => {
  it('filters transactions by area, district, type and five-year date window', () => {
    const matches = findComparableTransactions(
      listing,
      [
        transaction('match'),
        transaction('wrong-district', { district: '信義區' }),
        transaction('wrong-area', { buildingArea: 40 }),
        transaction('too-old', { transactionDate: '2010-01-01T00:00:00.000Z' }),
        transaction('unknown-date', { transactionDate: undefined }),
      ],
      Date.parse('2026-01-01T00:00:00.000Z'),
    );
    expect(matches.map((item) => item.id)).toEqual(['match']);
  });
  it('preserves unique URL IDs and caps compare selection at four', () => {
    expect(compareIdsFromUrl('a,b,a,c,d,e')).toEqual(['a', 'b', 'c', 'd']);
    expect(addCompareId(['a', 'b', 'c', 'd'], 'e')).toEqual(['a', 'b', 'c', 'd']);
    expect(addCompareId(['a'], 'b')).toEqual(['a', 'b']);
  });
});
