import { describe, expect, it } from 'vitest';
import {
  classifySaleHttpFailure,
  collectSalePages,
} from '../crawler/collectors/591-sale/collector';
import {
  normalizeSale,
  normalizeSaleInProduction,
} from '../crawler/collectors/591-sale/normalizer';
import {
  parseSaleJson,
  parseSalePage,
  parseSaleResponse,
  classifySaleResponse,
} from '../crawler/collectors/591-sale/parser';
import { buildSaleRequest } from '../crawler/collectors/591-sale/request';

const raw = {
  sourceListingId: '123',
  title: '三房中古屋',
  city: '台北市',
  district: '信義區',
  totalPriceText: '2580萬',
  unitPriceText: '78萬/坪',
  buildingAreaText: '32.5坪',
  roomsText: '3房',
  mrtText: '市政府站',
  sourceUrl: 'https://sale.591.com.tw/home/123',
  raw: { listingType: '中古屋' },
};
describe('591 sale collector', () => {
  it('builds an inferred minimal request without credentials', () => {
    const request = buildSaleRequest('臺北市', 1, 20);
    expect(request.url).toContain('city_id=1');
    expect(request.url).toContain('page=1');
    expect(request.method).toBe('GET');
    expect(request.headers).toEqual({ Accept: 'application/json' });
    expect(request).not.toHaveProperty('cookie');
    expect(request).not.toHaveProperty('authorization');
  });
  it('maps both production city ids and rejects invalid request values', () => {
    expect(buildSaleRequest('臺北市').url).toContain('city_id=1');
    expect(buildSaleRequest('新北市').url).toContain('city_id=3');
    expect(() => buildSaleRequest('臺北市', 0)).toThrow('INVALID_REQUEST');
  });
  it('parses and normalizes a fixture listing', () => {
    const result = parseSalePage([raw], 1);
    expect(result.status).toBe('SUCCESS');
    const listing = normalizeSale(result.items[0]!);
    expect(listing.id).toBe('591-sale:123');
    expect(listing.totalPrice).toBe(25_800_000);
    expect(listing.buildingArea).toBe(32.5);
    expect(listing.rooms).toBe(3);
  });
  it('preserves ranges and unknown prices without midpoint', () => {
    const listing = normalizeSale({
      ...raw,
      sourceListingId: '124',
      totalPriceText: '1800～2600萬',
      unitPriceText: '78～92萬/坪',
      buildingAreaText: '28～45坪',
      roomsText: '2～4房',
    });
    expect(listing.totalPrice).toBeUndefined();
    expect(listing.minTotalPrice).toBe(18_000_000);
    expect(listing.maxTotalPrice).toBe(26_000_000);
    expect(listing.minUnitPrice).toBe(780_000);
    expect(listing.maxUnitPrice).toBe(920_000);
    expect(listing.minBuildingArea).toBe(28);
    expect(listing.maxBuildingArea).toBe(45);
    expect(listing.rooms).toBeUndefined();
  });
  it('keeps source identity independent and treats unknown type conservatively', () => {
    const listing = normalizeSale({
      ...raw,
      sourceListingId: '125',
      raw: { listingType: '新建案' },
      totalPriceText: '價格待定',
    });
    expect(listing.id).toBe('591-sale:125');
    expect(listing.listingType).toBe('UNKNOWN');
    expect(listing.totalPrice).toBeUndefined();
  });
  it('detects duplicate pages and returns partial on mid-crawl failure', async () => {
    const duplicate = await collectSalePages(async () => [raw], 5);
    expect(duplicate.warnings[0]).toContain('duplicate');
    let page = 0;
    const partial = await collectSalePages(async () => {
      page += 1;
      if (page === 2) throw new Error('TIMEOUT');
      return [raw];
    }, 5);
    expect(partial.status).toBe('PARTIAL');
  });
  it('marks malformed source payload as failed', () => {
    expect(parseSalePage({ unexpected: true }, 1).status).toBe('FAILED');
  });
  it('parses the inferred BFF envelope and maps planned sale fields', () => {
    const result = parseSaleResponse(
      {
        status: 1,
        data: {
          house_list: [
            {
              houseid: 'bff-1',
              title: '測試',
              city: '臺北市',
              district: '信義區',
              address: '測試路',
              price: '2580萬',
              area: '32坪',
              room: '3房',
              floor: '8',
              totalFloors: '12',
              age: '5',
              buildingType: '住宅大樓',
              parking: '坡道平面',
              url: 'https://sale.591.com.tw/home/bff-1',
            },
          ],
        },
      },
      1,
    );
    const listing = normalizeSale(result.items[0]!);
    expect(result.status).toBe('SUCCESS');
    expect(listing.address).toBe('測試路');
    expect(listing.floor).toBe(8);
    expect(listing.buildingType).toBe('RESIDENTIAL_HIGHRISE');
    expect(listing.hasParking).toBe(true);
  });
  it('classifies Sale access and rate-limit failures', () => {
    expect(classifySaleHttpFailure(403)).toEqual({
      status: 'FAILED',
      errorCode: 'ACCESS_DENIED',
      retryable: false,
    });
    expect(classifySaleHttpFailure(429)).toEqual({
      status: 'PARTIAL',
      errorCode: 'RATE_LIMITED',
      retryable: true,
    });
  });
  it('fails closed for malformed, non-json, access denied and rate limited responses', () => {
    expect(parseSaleJson('{', 1).errors).toContain('MALFORMED_JSON');
    expect(classifySaleResponse(500, 'text/html')).toBe('NON_JSON');
    expect(classifySaleResponse(403, 'application/json')).toBe('ACCESS_DENIED');
    expect(classifySaleResponse(429, 'application/json')).toBe('RATE_LIMITED');
  });
  it('enforces the production city boundary and stable source identity', () => {
    const listing = normalizeSaleInProduction(
      { ...raw, sourceListingId: 'scope-1', city: '臺北市' },
      '2026-08-25T00:00:00.000Z',
    );
    expect(listing.id).toBe('591-sale:scope-1');
    expect(listing.sourceId).toBe('591-sale');
    expect(() =>
      normalizeSaleInProduction({ ...raw, city: '桃園市' }, '2026-08-25T00:00:00.000Z'),
    ).toThrow('OUT_OF_SCOPE');
    expect(() =>
      normalizeSaleInProduction({ ...raw, city: undefined }, '2026-08-25T00:00:00.000Z'),
    ).toThrow('OUT_OF_SCOPE');
  });
});
