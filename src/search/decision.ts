import type { Listing } from '../../shared/domain';
import type { Range, SearchCriteria } from './engine';

export interface MatchFactor {
  label: string;
  score: number;
}

const clamp = (value: number) => Math.max(0, Math.min(100, value));

function rangeScore(value: number | undefined, range: Range | undefined): number | undefined {
  if (!range || value === undefined) return undefined;
  if (range.min !== undefined && range.max !== undefined) {
    const center = (range.min + range.max) / 2;
    const radius = (range.max - range.min) / 2;
    return radius === 0
      ? value === center
        ? 100
        : 0
      : clamp(100 * (1 - Math.abs(value - center) / radius));
  }
  if (range.max !== undefined) return range.max <= 0 ? 100 : clamp(100 * (1 - value / range.max));
  if (range.min !== undefined)
    return range.min <= 0 ? 100 : clamp(50 + (50 * (value - range.min)) / range.min);
  return undefined;
}

export function matchFactors(listing: Listing, criteria: SearchCriteria): MatchFactor[] {
  const factors: MatchFactor[] = [];
  const exact = (active: boolean, matches: boolean, label: string) => {
    if (active) factors.push({ label, score: matches ? 100 : 0 });
  };
  exact(Boolean(criteria.city), listing.city === criteria.city, '縣市');
  exact(
    Boolean(criteria.districts?.length),
    Boolean(listing.district && criteria.districts?.includes(listing.district)),
    '行政區',
  );
  exact(
    Boolean(criteria.mrtStations?.length),
    Boolean(listing.nearestMrtStation && criteria.mrtStations?.includes(listing.nearestMrtStation)),
    '捷運站',
  );
  exact(
    Boolean(criteria.hasElevator !== undefined),
    listing.hasElevator === criteria.hasElevator,
    '電梯',
  );
  exact(
    Boolean(criteria.hasParking !== undefined),
    listing.hasParking === criteria.hasParking,
    '車位',
  );
  exact(
    Boolean(criteria.parkingTypes?.length),
    Boolean(listing.parkingType && criteria.parkingTypes?.includes(listing.parkingType)),
    '車位類型',
  );
  exact(
    Boolean(criteria.buildingTypes?.length),
    Boolean(listing.buildingType && criteria.buildingTypes?.includes(listing.buildingType)),
    '建物型態',
  );
  exact(
    Boolean(criteria.listingTypes?.length),
    criteria.listingTypes?.includes(listing.listingType) ?? false,
    '房屋類型',
  );

  const numeric: [string, number | undefined, Range | undefined][] = [
    [
      '總價',
      listing.totalPrice ?? listing.minTotalPrice ?? listing.maxTotalPrice,
      criteria.totalPrice,
    ],
    ['單價', listing.unitPrice ?? listing.minUnitPrice ?? listing.maxUnitPrice, criteria.unitPrice],
    ['室內坪數', listing.mainArea, criteria.mainArea],
    [
      '權狀坪數',
      listing.buildingArea ?? listing.minBuildingArea ?? listing.maxBuildingArea,
      criteria.buildingArea,
    ],
    ['屋齡', listing.buildingAge, criteria.buildingAge],
    ['樓層', listing.floor, criteria.floor],
    ['管理費', listing.managementFee, criteria.managementFee],
  ];
  for (const [label, value, range] of numeric) {
    const score = rangeScore(value, range);
    if (score !== undefined) factors.push({ label, score });
  }
  if (criteria.minRooms !== undefined && listing.rooms !== undefined)
    factors.push({
      label: '房數',
      score: rangeScore(listing.rooms, { min: criteria.minRooms }) ?? 0,
    });
  return factors;
}

export function decisionScore(listing: Listing, criteria: SearchCriteria): number | undefined {
  const factors = matchFactors(listing, criteria);
  if (!factors.length) return undefined;
  return Math.round(factors.reduce((sum, factor) => sum + factor.score, 0) / factors.length);
}

const normalizedAddress = (address: string) =>
  address
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\-_,，。.#號]/g, '');

export function findPossibleDuplicates(listings: Listing[]): Map<string, Listing[]> {
  const buckets = new Map<string, Listing[]>();
  for (const listing of listings) {
    if (
      !listing.city ||
      !listing.district ||
      !listing.address?.trim() ||
      listing.buildingArea === undefined ||
      listing.buildingArea <= 0
    )
      continue;
    const key = [listing.city, listing.district, normalizedAddress(listing.address)].join('|');
    const bucket = buckets.get(key) ?? [];
    bucket.push(listing);
    buckets.set(key, bucket);
  }
  const matches = new Map<string, Listing[]>();
  for (const bucket of buckets.values()) {
    for (let leftIndex = 0; leftIndex < bucket.length; leftIndex += 1) {
      const left = bucket[leftIndex];
      if (!left) continue;
      for (let rightIndex = leftIndex + 1; rightIndex < bucket.length; rightIndex += 1) {
        const right = bucket[rightIndex];
        if (!right || left.sourceId === right.sourceId) continue;
        const areaRatio = right.buildingArea! / left.buildingArea!;
        if (areaRatio < 0.97 || areaRatio > 1.03) continue;
        if (left.rooms !== undefined && right.rooms !== undefined && left.rooms !== right.rooms)
          continue;
        if (left.floor !== undefined && right.floor !== undefined && left.floor !== right.floor)
          continue;
        matches.set(left.id, [...(matches.get(left.id) ?? []), right]);
        matches.set(right.id, [...(matches.get(right.id) ?? []), left]);
      }
    }
  }
  return matches;
}
