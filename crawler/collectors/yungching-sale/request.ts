import type { ProductionCity } from '../../scope/production';

const citySlug: Record<ProductionCity, string> = { 臺北市: '台北市', 新北市: '新北市' };

export function buildYungchingSaleRequest(city: ProductionCity, page = 1): RequestInit & { url: string } {
  if (!Number.isInteger(page) || page < 1) throw new Error('INVALID_REQUEST: page must be positive');
  const url = `https://buy.yungching.com.tw/list/${encodeURIComponent(citySlug[city])}-_c${page > 1 ? `?pg=${page}` : ''}`;
  return { url, method: 'GET', headers: { Accept: 'text/html' } };
}
