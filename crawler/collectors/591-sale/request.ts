import { sourceCityId, type ProductionCity } from '../../scope/production';

export const SALE_ENDPOINT = 'https://bff-house.591.com.tw/v1/web/sale/list';

export interface SaleRequest {
  url: string;
  method: 'GET';
  headers: { Accept: 'application/json' };
}

/** Query names are inferred and remain unverified until a legal live response is obtained. */
export function buildSaleRequest(city: ProductionCity, page = 1, pageSize = 20): SaleRequest {
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1) {
    throw new Error('INVALID_REQUEST: page and pageSize must be positive integers');
  }
  const query = new URLSearchParams({
    city_id: sourceCityId('591-sale', city),
    page: String(page),
    page_size: String(pageSize),
  });
  return {
    url: `${SALE_ENDPOINT}?${query.toString()}`,
    method: 'GET',
    headers: { Accept: 'application/json' },
  };
}
