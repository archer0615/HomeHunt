import { describe, expect, it } from 'vitest';
import { criteriaFromSearch, criteriaToSearch } from '../src/search/url';
describe('search URL state', () => {
  it('round trips criteria deterministically including zero', () => {
    const value = {
      city: '台北市',
      districts: ['信義區'],
      mrtStations: ['市政府', '永春'],
      totalPrice: { min: 0, max: 20000000 },
      unitPrice: { max: 900000 },
      minRooms: 3,
      hasElevator: true,
      hasParking: false,
      parkingTypes: ['RAMP_FLAT'] as const,
    };
    const restored = criteriaFromSearch(criteriaToSearch(value));
    expect(restored).toEqual({ ...value, parkingTypes: ['RAMP_FLAT'] });
  });
  it('ignores malformed numeric URL values', () => {
    expect(criteriaFromSearch('rooms=abc&priceMax=NaN')).toEqual({});
  });
});
