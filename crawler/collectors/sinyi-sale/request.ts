import type { ProductionCity } from '../../scope/production';
const slugs: Record<ProductionCity, string> = { 臺北市: 'Taipei-city', 新北市: 'NewTaipei-city' };
export function buildSinyiSaleRequest(city: ProductionCity, page = 1): RequestInit & { url: string } { if (!Number.isInteger(page) || page < 1) throw new Error('INVALID_REQUEST: page must be positive'); return { url: `https://www.sinyi.com.tw/buy/list/${slugs[city]}${page > 1 ? `/${page}` : ''}`, method: 'GET', headers: { Accept: 'text/html' } }; }
