import type { RawYungchingSaleListing, YungchingCollectorResult } from './types';
const text = (v: unknown): string | undefined => typeof v === 'string' || typeof v === 'number' ? String(v) : undefined;
export function parseYungchingItems(payload: unknown): RawYungchingSaleListing[] { if (!Array.isArray(payload)) throw new Error('SOURCE_CHANGED: expected listing item array'); return payload.map((item) => { if (!item || typeof item !== 'object') throw new Error('PARSE_ERROR: invalid listing item'); const r = item as Record<string, unknown>; return { sourceListingId: text(r.sourceListingId ?? r.id ?? r.houseId ?? r.houseid ?? r.編號), title: text(r.title ?? r.標題), city: text(r.city ?? r.縣市), district: text(r.district ?? r.行政區), addressText: text(r.addressText ?? r.address ?? r.地址), totalPriceText: text(r.totalPriceText ?? r.price ?? r.總價), unitPriceText: text(r.unitPriceText ?? r.unitPrice ?? r.單價), buildingAreaText: text(r.buildingAreaText ?? r.area ?? r.建坪), roomsText: text(r.roomsText ?? r.rooms ?? r.格局), hallsText: text(r.hallsText ?? r.halls), bathroomsText: text(r.bathroomsText ?? r.bathrooms), floorText: text(r.floorText ?? r.floor ?? r.樓層), totalFloorsText: text(r.totalFloorsText ?? r.totalFloors ?? r.總樓層), buildingAgeText: text(r.buildingAgeText ?? r.age ?? r.屋齡), buildingTypeText: text(r.buildingTypeText ?? r.buildingType ?? r.型態), parkingText: text(r.parkingText ?? r.parking ?? r.車位), mrtText: text(r.mrtText ?? r.mrt ?? r.捷運), sourceUrl: text(r.sourceUrl ?? r.url ?? r.網址), raw: r }; }); }
export function parseYungchingPage(payload: unknown, page: number): YungchingCollectorResult { try { return { status: 'SUCCESS', items: parseYungchingItems(payload), fetchedPages: page, warnings: [], errors: [] }; } catch (e) { return { status: 'FAILED', items: [], fetchedPages: page, warnings: [], errors: [e instanceof Error ? e.message : 'PARSE_ERROR'] }; } }

function clean(value: string): string { return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim(); }

/** Parses the public server-rendered listing anchors captured as deterministic fixtures. */
export function parseYungchingHtml(html: string, page: number): YungchingCollectorResult {
  try {
    if (!html.trim()) throw new Error('SOURCE_CHANGED: empty HTML');
    const items: RawYungchingSaleListing[] = [];
    const anchorPattern = /<a\b[^>]*href=["']([^"']*\/house\/([\w-]+))["'][^>]*>([\s\S]*?)<\/a>/gi;
    for (const match of html.matchAll(anchorPattern)) {
      const sourceUrl = new URL(match[1]!, 'https://buy.yungching.com.tw').toString();
      const description = clean(match[3]!);
      const location = description.match(/(臺北市|台北市|新北市)([^\s]+區)/);
      const building = description.match(/(住宅大樓|辦公商業大樓|華廈|公寓|透天厝|別墅|廠辦)/);
      const age = description.match(/(\d+(?:\.\d+)?)年/);
      const area = description.match(/建坪\s*(\d+(?:\.\d+)?)/);
      const rooms = description.match(/(\d+)房(?:\(室\))?(\d+)廳([^|\s]+)衛/);
      const parking = description.match(/\|([^|]*?車位)(?=\s|$)/);
      const prices = [...description.matchAll(/(\d{1,3}(?:,\d{3})*)萬/g)].map((value) => value[1]);
      const city = location?.[1] === '台北市' ? '臺北市' : location?.[1];
      items.push({ sourceListingId: match[2], title: description.split(location?.[0] ?? ' ')[0].replace(/^人氣推薦|^精選推薦/, '').trim(), city, district: location?.[2], totalPriceText: prices.at(-1) ? `${prices.at(-1)}萬` : undefined, buildingAreaText: area?.[1] ? `${area[1]}坪` : undefined, roomsText: rooms?.[1] ? `${rooms[1]}房` : undefined, hallsText: rooms?.[2], bathroomsText: rooms?.[3]?.replace(/[^\d.]/g, ''), buildingAgeText: age?.[1], buildingTypeText: building?.[1], parkingText: parking?.[1], sourceUrl, raw: { html: match[0], description } });
    }
    if (!items.length) throw new Error('SOURCE_CHANGED: no /house/{id} listing anchors');
    return { status: 'SUCCESS', items, fetchedPages: page, warnings: [], errors: [] };
  } catch (e) { return { status: 'FAILED', items: [], fetchedPages: page, warnings: [], errors: [e instanceof Error ? e.message : 'PARSE_ERROR'] }; }
}
