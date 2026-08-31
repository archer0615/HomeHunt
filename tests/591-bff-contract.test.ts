import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  classify591HttpFailure,
  inspectNewHouseResponse,
  inspectSaleResponse,
  parse591Json,
} from '../crawler/collectors/591-contract/inspection';
import { PRODUCTION_SCOPE } from '../crawler/scope/production';
const fixture = (name: string) => readFileSync(resolve('tests/fixtures/591', name), 'utf8');
describe('591 BFF contract fixtures (inferred, live-unverified)', () => {
  it('inspects Sale house_list and empty house_list', () => {
    expect(inspectSaleResponse(JSON.parse(fixture('sale-success.inferred.json')))).toMatchObject({
      status: 'SUCCESS',
      total: 1,
      items: [{ houseid: 'sale-fixture-1' }],
    });
    expect(inspectSaleResponse(JSON.parse(fixture('sale-empty.inferred.json')))).toMatchObject({
      status: 'SUCCESS',
      total: 0,
      items: [],
    });
  });
  it('rejects Sale invalid envelope and malformed JSON', () => {
    expect(inspectSaleResponse({ status: 1, data: {} }).errorCode).toBe('INVALID_ENVELOPE');
    expect(parse591Json(fixture('malformed.json'))).toMatchObject({
      status: 'FAILED',
      errorCode: 'INVALID_JSON',
    });
  });
  it('inspects NewHouse status, items, total, per_page and item fields', () => {
    const result = inspectNewHouseResponse(JSON.parse(fixture('newhouse-success.inferred.json')));
    expect(result).toMatchObject({
      status: 'SUCCESS',
      total: 1,
      perPage: 1,
      items: [{ id: 'newhouse-fixture-1', type: '預售屋', city: '臺北市', district: '大安區' }],
    });
    expect(
      inspectNewHouseResponse(JSON.parse(fixture('newhouse-empty.inferred.json'))),
    ).toMatchObject({ status: 'SUCCESS', total: 0, items: [] });
  });
  it('rejects NewHouse invalid envelope and classifies HTTP failures', () => {
    expect(inspectNewHouseResponse({ status: 1, data: {} }).errorCode).toBe('INVALID_ENVELOPE');
    expect(classify591HttpFailure(403).errorCode).toBe('ACCESS_DENIED');
    expect(classify591HttpFailure(429).errorCode).toBe('RATE_LIMITED');
    expect(classify591HttpFailure(403, 'text/html').errorCode).toBe('NON_JSON');
  });
  it('preserves Taipei/New Taipei scope and excludes other cities', () => {
    expect(PRODUCTION_SCOPE.sources['591-sale'].cities).toEqual({ 臺北市: '1', 新北市: '3' });
    expect(PRODUCTION_SCOPE.sources['591-newhouse'].cities).toEqual({ 臺北市: '1', 新北市: '3' });
    expect(PRODUCTION_SCOPE.cities).not.toContain('桃園市');
  });
});
