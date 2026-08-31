import type { Raw591SaleListing, SaleCollectorResult, SaleErrorCode } from './types';

export function parseSaleItems(payload: unknown): Raw591SaleListing[] {
  if (!Array.isArray(payload)) throw new Error('SOURCE_CHANGED: expected listing item array');
  return payload.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('PARSE_ERROR: invalid listing item');
    const raw = item as Record<string, unknown>;
    return {
      sourceListingId: stringValue(raw.sourceListingId ?? raw.id ?? raw.houseid),
      title: stringValue(raw.title),
      city: stringValue(raw.city),
      district: stringValue(raw.district),
      addressText: stringValue(raw.addressText ?? raw.address),
      totalPriceText: stringValue(raw.totalPriceText ?? raw.price),
      unitPriceText: stringValue(raw.unitPriceText ?? raw.unitPrice),
      buildingAreaText: stringValue(raw.buildingAreaText ?? raw.area),
      roomsText: stringValue(raw.roomsText ?? raw.rooms),
      hallsText: stringValue(raw.hallsText ?? raw.halls),
      bathroomsText: stringValue(raw.bathroomsText ?? raw.bathrooms),
      floorText: stringValue(raw.floorText ?? raw.floor),
      totalFloorsText: stringValue(raw.totalFloorsText ?? raw.totalFloors),
      buildingAgeText: stringValue(raw.buildingAgeText ?? raw.age),
      buildingTypeText: stringValue(raw.buildingTypeText ?? raw.buildingType),
      parkingText: stringValue(raw.parkingText ?? raw.parking),
      mrtText: stringValue(raw.mrtText ?? raw.mrt),
      sourceUrl: stringValue(raw.sourceUrl ?? raw.url),
      raw,
    };
  });
}
function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
}
export function parseSaleResponse(payload: unknown, page: number): SaleCollectorResult {
  try {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload))
      throw new Error('SOURCE_CHANGED: expected Sale BFF envelope');
    const envelope = payload as Record<string, unknown>;
    const data = envelope.data;
    if (!data || typeof data !== 'object' || Array.isArray(data))
      throw new Error('SOURCE_CHANGED: missing Sale BFF data');
    const items = (data as Record<string, unknown>).house_list;
    if (!Array.isArray(items)) throw new Error('SOURCE_CHANGED: missing data.house_list');
    return {
      status: 'SUCCESS',
      items: parseSaleItems(items),
      fetchedPages: page,
      warnings: [],
      errors: [],
    };
  } catch (error) {
    return {
      status: 'FAILED',
      items: [],
      fetchedPages: page,
      warnings: [],
      errors: [error instanceof Error ? error.message : 'PARSE_ERROR'],
    };
  }
}

export function parseSaleJson(text: string, page: number): SaleCollectorResult {
  try {
    return parseSaleResponse(JSON.parse(text) as unknown, page);
  } catch {
    return {
      status: 'FAILED',
      items: [],
      fetchedPages: page,
      warnings: [],
      errors: ['MALFORMED_JSON'],
    };
  }
}

export function classifySaleResponse(
  status: number,
  contentType: string | undefined,
): SaleErrorCode | undefined {
  if (status === 403) return 'ACCESS_DENIED';
  if (status === 429) return 'RATE_LIMITED';
  if (!contentType?.toLowerCase().includes('json')) return 'NON_JSON';
  return undefined;
}
export function parseSalePage(payload: unknown, page: number): SaleCollectorResult {
  try {
    const items = parseSaleItems(payload);
    return { status: 'SUCCESS', items, fetchedPages: page, warnings: [], errors: [] };
  } catch (error) {
    return {
      status: 'FAILED',
      items: [],
      fetchedPages: page,
      warnings: [],
      errors: [error instanceof Error ? error.message : 'PARSE_ERROR'],
    };
  }
}
