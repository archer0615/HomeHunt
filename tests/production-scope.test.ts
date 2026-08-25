import { describe, expect, it } from 'vitest';
import { bootstrapProductionScope } from '../crawler/bootstrap';
import { refreshProductionScope } from '../crawler/refresh/orchestrator';
import { isMoiTransactionInRollingWindow, isProductionCity, isProductionDistrict, moiRollingWindow, PRODUCTION_SCOPE, sourceCityId } from '../crawler/scope/production';

describe('production crawl scope v1', () => {
  it('includes Taipei and New Taipei, but excludes other cities', () => {
    expect(isProductionCity('臺北市')).toBe(true);
    expect(isProductionCity('新北市')).toBe(true);
    expect(isProductionCity('桃園市')).toBe(false);
    expect(isProductionCity('基隆市')).toBe(false);
    expect(isProductionCity('臺中市')).toBe(false);
    expect(isProductionDistrict('臺北市', '信義區')).toBe(true);
    expect(isProductionDistrict('新北市', '板橋區')).toBe(true);
  });

  it('uses a rolling five-year MOI window with inclusive boundaries', () => {
    const reference = '2026-08-25T00:00:00.000Z';
    const window = moiRollingWindow(reference);
    expect(window.from).toBe('2021-08-25T00:00:00.000Z');
    expect(isMoiTransactionInRollingWindow('2021-08-25T00:00:00.000Z', reference)).toBe(true);
    expect(isMoiTransactionInRollingWindow('2021-08-24T23:59:59.000Z', reference)).toBe(false);
    expect(isMoiTransactionInRollingWindow('2026-08-25T00:00:00.000Z', reference)).toBe(true);
  });

  it('keeps source-specific city mappings in the scope source of truth', () => {
    expect(sourceCityId('moi', '臺北市')).toBe('臺北市');
    expect(sourceCityId('moi', '新北市')).toBe('新北市');
    expect(sourceCityId('591-sale', '臺北市')).toBe('1');
    expect(sourceCityId('591-sale', '新北市')).toBe('3');
    expect(sourceCityId('591-newhouse', '臺北市')).toBe('1');
    expect(sourceCityId('591-newhouse', '新北市')).toBe('3');
  });

  it('uses the same production scope for bootstrap and refresh', () => {
    expect(bootstrapProductionScope).toBe(PRODUCTION_SCOPE);
    expect(refreshProductionScope).toBe(PRODUCTION_SCOPE);
  });
});
