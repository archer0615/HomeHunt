import type { BuildingType, Listing, ListingType, ParkingType } from '../../shared/domain';

export interface Range {
  min?: number;
  max?: number;
}
export interface SearchCriteria {
  city?: string;
  districts?: string[];
  mrtStations?: string[];
  totalPrice?: Range;
  unitPrice?: Range;
  mainArea?: Range;
  buildingArea?: Range;
  minRooms?: number;
  buildingAge?: Range;
  floor?: Range;
  hasElevator?: boolean;
  hasParking?: boolean;
  parkingTypes?: ParkingType[];
  managementFee?: Range;
  buildingTypes?: BuildingType[];
  listingTypes?: ListingType[];
}
export type SortOption =
  | 'NEWEST'
  | 'UPDATED'
  | 'PRICE_ASC'
  | 'PRICE_DESC'
  | 'UNIT_PRICE_ASC'
  | 'UNIT_PRICE_DESC'
  | 'AREA_DESC'
  | 'AGE_ASC';
export const defaultCriteria: SearchCriteria = {};
const hardKeywords = ['凶宅', '事故屋', '非自然死亡'];
const softKeywords = ['頂樓加蓋', '持分'];
const text = (listing: Listing) =>
  [listing.title, listing.address, listing.buildingType].filter(Boolean).join(' ').toLowerCase();
export function isHardExcluded(listing: Listing, customKeywords: string[] = []): boolean {
  const content = text(listing);
  return (
    listing.floor === 1 ||
    content.includes('工業住宅') ||
    [...hardKeywords, ...customKeywords].some(
      (keyword) => keyword && content.includes(keyword.toLowerCase()),
    )
  );
}
export function warningsFor(listing: Listing, keywords: string[] = softKeywords): string[] {
  const content = text(listing);
  return keywords.filter((keyword) => content.includes(keyword.toLowerCase()));
}
function overlaps(
  value: number | undefined,
  minValue: number | undefined,
  maxValue: number | undefined,
  criteria?: Range,
): boolean {
  if (!criteria) return true;
  const low = value ?? minValue;
  const high = value ?? maxValue;
  if (low === undefined && high === undefined) return false;
  return (
    (criteria.max === undefined || (low !== undefined && low <= criteria.max)) &&
    (criteria.min === undefined || (high !== undefined && high >= criteria.min))
  );
}
function exact(value: number | undefined, criteria?: Range): boolean {
  return overlaps(value, undefined, undefined, criteria);
}
const selected = <T>(value: T | undefined, values?: T[]) =>
  !values?.length || (value !== undefined && values.includes(value));
export function matchesCriteria(listing: Listing, criteria: SearchCriteria): boolean {
  if (criteria.city && listing.city !== criteria.city) return false;
  if (
    criteria.districts?.length &&
    (!listing.district || !criteria.districts.includes(listing.district))
  )
    return false;
  if (
    criteria.mrtStations?.length &&
    (!listing.nearestMrtStation || !criteria.mrtStations.includes(listing.nearestMrtStation))
  )
    return false;
  if (
    !overlaps(
      listing.totalPrice,
      listing.minTotalPrice,
      listing.maxTotalPrice,
      criteria.totalPrice,
    ) ||
    !overlaps(listing.unitPrice, listing.minUnitPrice, listing.maxUnitPrice, criteria.unitPrice) ||
    !overlaps(listing.mainArea, undefined, undefined, criteria.mainArea) ||
    !overlaps(
      listing.buildingArea,
      listing.minBuildingArea,
      listing.maxBuildingArea,
      criteria.buildingArea,
    ) ||
    !exact(listing.buildingAge, criteria.buildingAge) ||
    !exact(listing.floor, criteria.floor) ||
    !exact(listing.managementFee, criteria.managementFee)
  )
    return false;
  if (
    criteria.minRooms !== undefined &&
    (listing.rooms === undefined || listing.rooms < criteria.minRooms)
  )
    return false;
  if (criteria.hasElevator !== undefined && listing.hasElevator !== criteria.hasElevator)
    return false;
  if (criteria.hasParking !== undefined && listing.hasParking !== criteria.hasParking) return false;
  return (
    selected(listing.parkingType, criteria.parkingTypes) &&
    selected(listing.buildingType, criteria.buildingTypes) &&
    selected(listing.listingType, criteria.listingTypes)
  );
}
const keyFor = (listing: Listing, option: SortOption): number | undefined =>
  ({
    NEWEST: Date.parse(listing.firstSeenAt),
    UPDATED: Date.parse(listing.updatedAt),
    PRICE_ASC: listing.totalPrice ?? listing.minTotalPrice,
    PRICE_DESC: listing.totalPrice ?? listing.maxTotalPrice,
    UNIT_PRICE_ASC: listing.unitPrice ?? listing.minUnitPrice,
    UNIT_PRICE_DESC: listing.unitPrice ?? listing.maxUnitPrice,
    AREA_DESC: listing.mainArea ?? listing.buildingArea ?? listing.maxBuildingArea,
    AGE_ASC: listing.buildingAge,
  })[option];
export function sortListings(listings: Listing[], option: SortOption): Listing[] {
  const desc = ['NEWEST', 'UPDATED', 'PRICE_DESC', 'UNIT_PRICE_DESC', 'AREA_DESC'].includes(option);
  return [...listings].sort((a, b) => {
    const av = keyFor(a, option);
    const bv = keyFor(b, option);
    if (av === undefined || bv === undefined)
      return av === bv ? a.id.localeCompare(b.id) : av === undefined ? 1 : -1;
    return av === bv ? a.id.localeCompare(b.id) : (av - bv) * (desc ? -1 : 1);
  });
}
export function searchListings(
  listings: Listing[],
  criteria: SearchCriteria,
  sort: SortOption,
  customHardKeywords: string[] = [],
): Listing[] {
  return sortListings(
    listings.filter(
      (listing) =>
        !isHardExcluded(listing, customHardKeywords) && matchesCriteria(listing, criteria),
    ),
    sort,
  );
}
