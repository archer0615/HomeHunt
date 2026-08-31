import type { Listing } from '../../../shared/domain';
import { listingSchema } from '../../../shared/schemas';
import { wanToNtd } from '../../../shared/utils';
import type { Raw591NewHouseListing } from './types';
const values = (value: string | undefined): number[] =>
  value
    ? [...value.replace(/,/g, '').matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]))
    : [];
const range = (
  value: string | undefined,
  unit: 'wan' | 'raw' = 'raw',
): [number | undefined, number | undefined] => {
  if (!value || /待定|未公開|洽詢|來電/.test(value)) return [undefined, undefined];
  const nums = values(value);
  if (!nums.length) return [undefined, undefined];
  const convert = (num: number) => (unit === 'wan' ? wanToNtd(num) : num);
  return [convert(nums[0]!), convert(nums[nums.length - 1]!)];
};
const isRange = (value: string | undefined) => Boolean(value && /[~～-]/.test(value));
function typeOf(value: string | undefined): Listing['listingType'] {
  if (!value) return 'UNKNOWN';
  if (/預售/.test(value)) return 'PRESALE';
  if (/新成屋|新古屋/.test(value)) return 'NEW';
  return 'UNKNOWN';
}
function idOf(raw: Raw591NewHouseListing): string {
  const id = raw.projectId ?? raw.sourceUrl?.match(/(?:id|project)[=/ -](\d+)/i)?.[1];
  if (!id) throw new Error('VALIDATION_ERROR: missing stable project ID');
  return `591-newhouse:${id}`;
}
export function normalizeNewHouse(
  raw: Raw591NewHouseListing,
  observedAt = new Date().toISOString(),
): Listing {
  const priceRange = range(raw.priceText, 'wan');
  const unitRange = range(raw.unitPriceText, 'wan');
  const areaRange = range(raw.areaText);
  const roomRange = range(raw.roomText);
  const exactPrice = !isRange(raw.priceText) ? priceRange[0] : undefined;
  const exactUnit = !isRange(raw.unitPriceText) ? unitRange[0] : undefined;
  const exactArea = !isRange(raw.areaText) ? areaRange[0] : undefined;
  const exactRoom = !isRange(raw.roomText) ? roomRange[0] : undefined;
  const result = {
    id: idOf(raw),
    sourceId: '591-newhouse',
    sourceListingId: raw.projectId ?? raw.sourceUrl?.match(/(?:id|project)[=/ -](\d+)/i)?.[1],
    listingType: typeOf(raw.projectType),
    title: raw.projectName,
    city: raw.city,
    district: raw.district,
    address: raw.addressText,
    nearestMrtStation: raw.mrtText,
    totalPrice: exactPrice,
    unitPrice: exactUnit,
    minTotalPrice: exactPrice === undefined ? priceRange[0] : undefined,
    maxTotalPrice: exactPrice === undefined ? priceRange[1] : undefined,
    minUnitPrice: exactUnit === undefined ? unitRange[0] : undefined,
    maxUnitPrice: exactUnit === undefined ? unitRange[1] : undefined,
    buildingArea: exactArea,
    minBuildingArea: exactArea === undefined ? areaRange[0] : undefined,
    maxBuildingArea: exactArea === undefined ? areaRange[1] : undefined,
    rooms: exactRoom,
    minRooms: exactRoom === undefined ? roomRange[0] : undefined,
    maxRooms: exactRoom === undefined ? roomRange[1] : undefined,
    sourceUrl: raw.sourceUrl,
    status: 'ACTIVE',
    firstSeenAt: observedAt,
    lastSeenAt: observedAt,
    lastCheckedAt: observedAt,
    relistCount: 0,
    missingSuccessCount: 0,
    contentHash: JSON.stringify([
      raw.projectName,
      raw.projectType,
      raw.priceText,
      raw.unitPriceText,
      raw.areaText,
      raw.roomText,
    ]),
    rawDataHash: JSON.stringify(raw.raw),
    createdAt: observedAt,
    updatedAt: observedAt,
  };
  return listingSchema.parse(result) as Listing;
}
