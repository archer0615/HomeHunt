import { describe, expect, it } from 'vitest';
import { listingSchema, transactionSchema } from '../shared/schemas';
import { area, listingStatuses, wanToNtd } from '../shared';
import { pingToSqm, sqmToPing } from '../shared/utils';

const iso = '2026-08-24T08:20:00+08:00';
const listing = { id: '591-sale:1', sourceId: '591-sale', sourceListingId: '1', listingType: 'PRESALE', status: 'ACTIVE', firstSeenAt: iso, lastSeenAt: iso, lastCheckedAt: iso, relistCount: 0, missingSuccessCount: 0, contentHash: 'content', rawDataHash: 'raw', createdAt: iso, updatedAt: iso, minTotalPrice: 20_000_000, maxTotalPrice: 25_000_000, hasParking: undefined };

describe('shared domain schemas', () => {
  it('parses a range-price listing without exact price', () => { expect(listingSchema.parse(listing).minTotalPrice).toBe(20_000_000); });
  it('preserves unknown booleans and numbers', () => { const result = listingSchema.parse(listing); expect(result.hasParking).toBeUndefined(); expect(result.unitPrice).toBeUndefined(); });
  it('rejects invalid money, NaN, and status', () => { expect(() => listingSchema.parse({ ...listing, totalPrice: -1 })).toThrow(); expect(() => listingSchema.parse({ ...listing, totalPrice: Number.NaN })).toThrow(); expect(() => listingSchema.parse({ ...listing, status: 'RELISTED' })).toThrow(); });
  it('parses a transaction with an allowed type', () => { expect(transactionSchema.parse({ id: 'moi:1', sourceId: 'moi', transactionType: 'USED', createdAt: iso }).transactionType).toBe('USED'); });
  it('keeps canonical status values separate from events', () => { expect(listingStatuses).toContain('DELISTED'); expect(listingStatuses).not.toContain('RELISTED' as never); });
});

describe('shared utilities', () => {
  it('converts money and area units', () => { expect(wanToNtd(2580)).toBe(25_800_000); expect(wanToNtd(60.6)).toBe(606_000); expect(sqmToPing(92)).toBe(27.83); expect(pingToSqm(27.83)).toBe(92); });
  it('rejects invalid area and exposes canonical area validation', () => { expect(area.safeParse(-1).success).toBe(false); expect(() => sqmToPing(Number.POSITIVE_INFINITY)).toThrow(); });
});
