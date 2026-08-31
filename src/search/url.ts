import type { SearchCriteria } from './engine';
const list = (params: URLSearchParams, name: string) =>
  params.get(name)?.split(',').filter(Boolean);
const number = (params: URLSearchParams, name: string) => {
  const value = params.get(name);
  if (value === null || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};
export function criteriaFromSearch(search: string): SearchCriteria {
  const p = new URLSearchParams(search);
  const range = (name: string) => {
    const min = number(p, `${name}Min`);
    const max = number(p, `${name}Max`);
    return min === undefined && max === undefined ? undefined : { min, max };
  };
  const boolean = (name: string) => (p.get(name) === null ? undefined : p.get(name) === 'true');
  return {
    city: p.get('city') ?? undefined,
    districts: list(p, 'districts'),
    mrtStations: list(p, 'mrt'),
    totalPrice: range('price'),
    minRooms: number(p, 'rooms'),
    listingTypes: list(p, 'types') as SearchCriteria['listingTypes'],
    unitPrice: range('unitPrice'),
    mainArea: range('mainArea'),
    buildingArea: range('buildingArea'),
    buildingAge: range('age'),
    floor: range('floor'),
    managementFee: range('fee'),
    hasElevator: boolean('elevator'),
    hasParking: boolean('parkingRequired'),
    parkingTypes: list(p, 'parking') as SearchCriteria['parkingTypes'],
    buildingTypes: list(p, 'buildingTypes') as SearchCriteria['buildingTypes'],
  };
}
export function criteriaToSearch(criteria: SearchCriteria): string {
  const p = new URLSearchParams();
  if (criteria.city) p.set('city', criteria.city);
  if (criteria.districts?.length) p.set('districts', criteria.districts.join(','));
  if (criteria.mrtStations?.length) p.set('mrt', criteria.mrtStations.join(','));
  if (criteria.totalPrice?.min !== undefined) p.set('priceMin', String(criteria.totalPrice.min));
  if (criteria.totalPrice?.max !== undefined) p.set('priceMax', String(criteria.totalPrice.max));
  if (criteria.minRooms !== undefined) p.set('rooms', String(criteria.minRooms));
  if (criteria.listingTypes?.length) p.set('types', criteria.listingTypes.join(','));
  const putRange = (name: string, value?: { min?: number; max?: number }) => {
    if (value?.min !== undefined) p.set(`${name}Min`, String(value.min));
    if (value?.max !== undefined) p.set(`${name}Max`, String(value.max));
  };
  putRange('unitPrice', criteria.unitPrice);
  putRange('mainArea', criteria.mainArea);
  putRange('buildingArea', criteria.buildingArea);
  putRange('age', criteria.buildingAge);
  putRange('floor', criteria.floor);
  putRange('fee', criteria.managementFee);
  if (criteria.hasElevator !== undefined) p.set('elevator', String(criteria.hasElevator));
  if (criteria.hasParking !== undefined) p.set('parkingRequired', String(criteria.hasParking));
  if (criteria.parkingTypes?.length) p.set('parking', criteria.parkingTypes.join(','));
  if (criteria.buildingTypes?.length) p.set('buildingTypes', criteria.buildingTypes.join(','));
  return p.toString();
}
