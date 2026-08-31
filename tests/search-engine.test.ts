import { describe, expect, it } from 'vitest';
import type { Listing } from '../shared/domain';
import {
  isHardExcluded,
  matchesCriteria,
  searchListings,
  sortListings,
  warningsFor,
} from '../src/search/engine';

const listing = (id: string, values: Partial<Listing> = {}): Listing => ({
  id,
  sourceId: '591-sale',
  sourceListingId: id,
  listingType: 'USED',
  city: '台北市',
  district: '信義區',
  nearestMrtStation: '市政府',
  totalPrice: 20_000_000,
  unitPrice: 800_000,
  buildingArea: 30,
  mainArea: 20,
  rooms: 3,
  buildingAge: 5,
  floor: 5,
  hasElevator: true,
  hasParking: true,
  parkingType: 'RAMP_FLAT',
  managementFee: 3000,
  buildingType: 'RESIDENTIAL_HIGHRISE',
  status: 'ACTIVE',
  firstSeenAt: '2026-01-01T00:00:00.000Z',
  lastSeenAt: '2026-01-01T00:00:00.000Z',
  lastCheckedAt: '2026-01-01T00:00:00.000Z',
  relistCount: 0,
  missingSuccessCount: 0,
  contentHash: id,
  rawDataHash: id,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  ...values,
});
describe('search engine', () => {
  it('filters every canonical criterion and excludes unknown when enabled', () => {
    const item = listing('a');
    expect(
      matchesCriteria(item, {
        city: '台北市',
        districts: ['信義區'],
        mrtStations: ['市政府'],
        totalPrice: { max: 20_000_000 },
        unitPrice: { min: 700_000 },
        mainArea: { min: 20 },
        buildingArea: { max: 30 },
        minRooms: 3,
        buildingAge: { max: 5 },
        floor: { min: 5 },
        hasElevator: true,
        hasParking: true,
        parkingTypes: ['RAMP_FLAT'],
        managementFee: { max: 3000 },
        buildingTypes: ['RESIDENTIAL_HIGHRISE'],
        listingTypes: ['USED'],
      }),
    ).toBe(true);
    expect(
      matchesCriteria(listing('unknown', { hasElevator: undefined }), { hasElevator: true }),
    ).toBe(false);
  });
  it('uses overlap semantics for NewHouse ranges without averaging', () => {
    const ranged = listing('new', {
      listingType: 'NEW',
      totalPrice: undefined,
      minTotalPrice: 18_000_000,
      maxTotalPrice: 26_000_000,
      buildingArea: undefined,
      minBuildingArea: 20,
      maxBuildingArea: 35,
    });
    expect(
      matchesCriteria(ranged, { totalPrice: { max: 20_000_000 }, buildingArea: { min: 30 } }),
    ).toBe(true);
    expect(matchesCriteria(ranged, { totalPrice: { min: 30_000_000 } })).toBe(false);
  });
  it('applies hard excludes and retains soft warnings', () => {
    expect(isHardExcluded(listing('first', { floor: 1 }))).toBe(true);
    expect(isHardExcluded(listing('industrial', { title: '工業住宅' }))).toBe(true);
    expect(isHardExcluded(listing('custom', { title: '特殊標記' }), ['特殊標記'])).toBe(true);
    const warned = listing('warn', { title: '頂樓加蓋 持分' });
    expect(warningsFor(warned)).toEqual(['頂樓加蓋', '持分']);
    expect(searchListings([warned], {}, 'NEWEST')).toHaveLength(1);
  });
  it('sorts deterministically without mutating input', () => {
    const input = [
      listing('b', { totalPrice: undefined }),
      listing('a', { totalPrice: 10_000_000 }),
      listing('c', { totalPrice: 10_000_000 }),
    ];
    expect(sortListings(input, 'PRICE_ASC').map((item) => item.id)).toEqual(['a', 'c', 'b']);
    expect(input.map((item) => item.id)).toEqual(['b', 'a', 'c']);
  });
  it('sorts recent price drops by event time and keeps listings without drops last', () => {
    const input = [listing('old'), listing('new'), listing('none')];
    const drops = new Map([
      ['old', Date.parse('2026-01-02T00:00:00.000Z')],
      ['new', Date.parse('2026-01-03T00:00:00.000Z')],
    ]);
    expect(sortListings(input, 'PRICE_DROP', drops).map((item) => item.id)).toEqual([
      'new',
      'old',
      'none',
    ]);
  });
});
