import type { RawSinyiSaleListing, SinyiCollectorResult } from './types';

const clean = (v: string) => v.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const text = (v: unknown) => typeof v === 'string' || typeof v === 'number' ? String(v) : undefined;

export function parseSinyiItems(payload: unknown): RawSinyiSaleListing[] {
  if (!Array.isArray(payload)) throw new Error('SOURCE_CHANGED: expected listing item array');
  return payload.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('PARSE_ERROR: invalid listing item');
    const r = item as Record<string, unknown>;
    return { sourceListingId: text(r.sourceListingId ?? r.id ?? r.houseId ?? r.物件編號), title: text(r.title ?? r.標題), city: text(r.city ?? r.縣市), district: text(r.district ?? r.districtName ?? r.行政區), addressText: text(r.addressText ?? r.address ?? r.地址), totalPriceText: text(r.totalPriceText ?? r.price ?? r.總價), unitPriceText: text(r.unitPriceText ?? r.unitPrice ?? r.單價), buildingAreaText: text(r.buildingAreaText ?? r.area ?? r.建坪), roomsText: text(r.roomsText ?? r.rooms ?? r.格局), hallsText: text(r.hallsText ?? r.halls), bathroomsText: text(r.bathroomsText ?? r.bathrooms), floorText: text(r.floorText ?? r.floor ?? r.樓層), totalFloorsText: text(r.totalFloorsText ?? r.totalFloors ?? r.總樓層), buildingAgeText: text(r.buildingAgeText ?? r.age ?? r.屋齡), buildingTypeText: text(r.buildingTypeText ?? r.buildingType ?? r.型態), parkingText: text(r.parkingText ?? r.parking ?? r.車位), mrtText: text(r.mrtText ?? r.mrt ?? r.捷運), sourceUrl: text(r.sourceUrl ?? r.url), raw: r };
  });
}

export function parseSinyiHtml(html: string, page: number): SinyiCollectorResult {
  try {
    const items: RawSinyiSaleListing[] = [];
    const pattern = /<a\b[^>]*href=["']([^"']*\/buy\/house\/([A-Za-z0-9]+))["'][^>]*>([\s\S]*?)<\/a>/gi;
    for (const match of html.matchAll(pattern)) {
      const description = clean(match[3]!);
      const location = description.match(/(臺北市|台北市|新北市)([^\s]+區)/);
      const building = description.match(/(住宅大樓|大樓|華廈|公寓|套房|別墅|透天|辦公|廠房|店面)/);
      const address = location && building ? description.slice(description.indexOf(location[0]) + location[0].length, description.indexOf(building[0])).replace(/\d+(?:\.\d+)?年/g, '').trim() : undefined;
      const area = description.match(/建坪\s*(\d+(?:\.\d+)?)/);
      const floor = description.match(/(\d+)樓\s*\/\s*(\d+)樓/);
      const parking = description.match(/(坡道平面|坡道機械|升降平面|升降機械|塔式|兩個以上)車位/);
      const price = [...description.matchAll(/(\d{1,3}(?:,\d{3})*)萬/g)].at(-1)?.[1];
      const rooms = description.match(/(\d+)房(?:\(室\))?(\d+)廳([^|\s]+)衛/);
      items.push({ sourceListingId: match[2], title: description.split(location?.[0] ?? ' ')[0].trim(), city: location?.[1] === '台北市' ? '臺北市' : location?.[1], district: location?.[2], addressText: address, totalPriceText: price ? `${price}萬` : undefined, buildingAreaText: area?.[1] ? `${area[1]}坪` : undefined, roomsText: rooms?.[1] ? `${rooms[1]}房` : undefined, hallsText: rooms?.[2], bathroomsText: rooms?.[3]?.replace(/[^\d.]/g, ''), floorText: floor?.[1], totalFloorsText: floor?.[2], parkingText: parking?.[1], buildingTypeText: building?.[1], listingTypeText: /預售|新成屋|新古屋/.exec(description)?.[0], sourceUrl: new URL(match[1]!, 'https://www.sinyi.com.tw').toString(), raw: { html: match[0], description } });
    }
    if (!items.length) throw new Error('SOURCE_CHANGED: no /buy/house/{id} listing anchors');
    return { status: 'SUCCESS', items, fetchedPages: page, warnings: [], errors: [] };
  } catch (e) { return { status: 'FAILED', items: [], fetchedPages: page, warnings: [], errors: [e instanceof Error ? e.message : 'PARSE_ERROR'] };
  }
}
