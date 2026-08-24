import { describe, expect, it } from 'vitest';
import { collectSalePages } from '../crawler/collectors/591-sale/collector';
import { normalizeSale } from '../crawler/collectors/591-sale/normalizer';
import { parseSalePage } from '../crawler/collectors/591-sale/parser';

const raw = { sourceListingId: '123', title: '三房中古屋', city: '台北市', district: '信義區', totalPriceText: '2580萬', unitPriceText: '78萬/坪', buildingAreaText: '32.5坪', roomsText: '3房', mrtText: '市政府站', sourceUrl: 'https://sale.591.com.tw/home/123', raw: { listingType: '中古屋' } };
describe('591 sale collector', () => {
  it('parses and normalizes a fixture listing', () => { const result = parseSalePage([raw], 1); expect(result.status).toBe('SUCCESS'); const listing = normalizeSale(result.items[0]!); expect(listing.id).toBe('591-sale:123'); expect(listing.totalPrice).toBe(25_800_000); expect(listing.buildingArea).toBe(32.5); expect(listing.rooms).toBe(3); });
  it('preserves ranges and unknown prices without midpoint', () => { const listing = normalizeSale({ ...raw, sourceListingId: '124', totalPriceText: '1800～2600萬', unitPriceText: '78～92萬/坪', buildingAreaText: '28～45坪', roomsText: '2～4房' }); expect(listing.totalPrice).toBeUndefined(); expect(listing.minTotalPrice).toBe(18_000_000); expect(listing.maxTotalPrice).toBe(26_000_000); expect(listing.minUnitPrice).toBe(780_000); expect(listing.maxUnitPrice).toBe(920_000); expect(listing.minBuildingArea).toBe(28); expect(listing.maxBuildingArea).toBe(45); expect(listing.rooms).toBeUndefined(); });
  it('keeps source identity independent and treats unknown type conservatively', () => { const listing = normalizeSale({ ...raw, sourceListingId: '125', raw: { listingType: '新建案' }, totalPriceText: '價格待定' }); expect(listing.id).toBe('591-sale:125'); expect(listing.listingType).toBe('UNKNOWN'); expect(listing.totalPrice).toBeUndefined(); });
  it('detects duplicate pages and returns partial on mid-crawl failure', async () => { const duplicate = await collectSalePages(async () => [raw], 5); expect(duplicate.warnings[0]).toContain('duplicate'); let page = 0; const partial = await collectSalePages(async () => { page += 1; if (page === 2) throw new Error('TIMEOUT'); return [raw]; }, 5); expect(partial.status).toBe('PARTIAL'); });
  it('marks malformed source payload as failed', () => { expect(parseSalePage({ unexpected: true }, 1).status).toBe('FAILED'); });
});
