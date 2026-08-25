import { parseRocDate } from '../collectors/moi/normalizer';

export const PRODUCTION_CITIES = ['臺北市', '新北市'] as const;
export type ProductionCity = (typeof PRODUCTION_CITIES)[number];

export const PRODUCTION_DISTRICTS: Record<ProductionCity, readonly string[]> = {
  臺北市: ['中正區', '大同區', '中山區', '松山區', '大安區', '萬華區', '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'],
  新北市: ['板橋區', '三重區', '中和區', '永和區', '新莊區', '新店區', '樹林區', '鶯歌區', '三峽區', '淡水區', '汐止區', '瑞芳區', '土城區', '蘆洲區', '五股區', '泰山區', '林口區', '深坑區', '石碇區', '坪林區', '三芝區', '石門區', '八里區', '平溪區', '雙溪區', '貢寮區', '金山區', '萬里區', '烏來區'],
};

export const PRODUCTION_SCOPE = {
  version: 1,
  cities: PRODUCTION_CITIES,
  districts: PRODUCTION_DISTRICTS,
  sources: {
    moi: { cities: { 臺北市: '臺北市', 新北市: '新北市' } },
    '591-sale': { cities: { 臺北市: '1', 新北市: '3' } },
    '591-newhouse': { cities: { 臺北市: '1', 新北市: '3' } },
  },
  moiTransactionYears: 5,
} as const;

export type ProductionScope = typeof PRODUCTION_SCOPE;

export function isProductionCity(city: string | undefined): city is ProductionCity {
  return city !== undefined && (PRODUCTION_CITIES as readonly string[]).includes(city);
}

export function sourceCityId(sourceId: keyof typeof PRODUCTION_SCOPE.sources, city: ProductionCity): string {
  return PRODUCTION_SCOPE.sources[sourceId].cities[city];
}

export function isProductionDistrict(city: string | undefined, district: string | undefined): boolean {
  return isProductionCity(city) && district !== undefined && PRODUCTION_DISTRICTS[city].includes(district);
}

export function moiRollingWindow(referenceDate: string): { from: string; to: string } {
  const to = new Date(referenceDate);
  if (Number.isNaN(to.getTime())) throw new Error(`invalid reference date: ${referenceDate}`);
  const from = new Date(to);
  from.setFullYear(from.getFullYear() - PRODUCTION_SCOPE.moiTransactionYears);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function isMoiTransactionInRollingWindow(transactionDate: string | undefined, referenceDate: string): boolean {
  if (!transactionDate) return false;
  const window = moiRollingWindow(referenceDate);
  const value = parseRocDate(transactionDate) ?? transactionDate;
  const time = Date.parse(value);
  return Number.isFinite(time) && time >= Date.parse(window.from) && time <= Date.parse(window.to);
}
