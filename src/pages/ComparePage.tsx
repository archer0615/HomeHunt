import { Link, useSearchParams } from 'react-router-dom';
import type { Listing } from '../../shared/domain';
import { compareIdsFromUrl } from '../search/market-reference';

const value = (input: unknown) => (input === undefined ? '未提供' : String(input));

export function ComparePage({ listings }: { listings: Listing[] }) {
  const [params, setParams] = useSearchParams();
  const ids = compareIdsFromUrl(params.get('ids'));
  const selected = ids
    .map((id) => listings.find((listing) => listing.id === id))
    .filter((item) => item !== undefined);
  const remove = (id: string) => {
    const next = ids.filter((item) => item !== id);
    if (next.length) setParams({ ids: next.join(',') });
    else setParams({});
  };
  if (!selected.length)
    return (
      <section>
        <h2>房源比較</h2>
        <p>請從搜尋結果加入房源，最多比較四筆。</p>
        <Link to="/">返回搜尋</Link>
      </section>
    );
  const rows: [string, (listing: Listing) => string][] = [
    ['地區', (item) => [item.city, item.district].filter(Boolean).join(' · ') || '未提供'],
    ['類型', (item) => item.listingType],
    [
      '總價',
      (item) =>
        item.totalPrice === undefined ? '未提供' : `${item.totalPrice.toLocaleString()} 元`,
    ],
    [
      '單價',
      (item) =>
        item.unitPrice === undefined ? '未提供' : `${item.unitPrice.toLocaleString()} 元/坪`,
    ],
    [
      '權狀坪數',
      (item) => (item.buildingArea === undefined ? '未提供' : `${item.buildingArea} 坪`),
    ],
    ['室內坪數', (item) => value(item.mainArea)],
    [
      '格局',
      (item) =>
        item.rooms === undefined
          ? '未提供'
          : `${item.rooms} 房 ${value(item.halls)} 廳 ${value(item.bathrooms)} 衛`,
    ],
    ['屋齡', (item) => (item.buildingAge === undefined ? '未提供' : `${item.buildingAge} 年`)],
    [
      '樓層',
      (item) =>
        item.floor === undefined ? '未提供' : `${item.floor} / ${value(item.totalFloors)} 樓`,
    ],
    ['建物型態', (item) => value(item.buildingType)],
    [
      '電梯',
      (item) => (item.hasElevator === undefined ? '未提供' : item.hasElevator ? '有' : '無'),
    ],
    [
      '車位',
      (item) =>
        item.hasParking === undefined ? '未提供' : item.hasParking ? value(item.parkingType) : '無',
    ],
    ['捷運站', (item) => value(item.nearestMrtStation)],
  ];
  return (
    <section aria-labelledby="compare-title" className="compare-page">
      <h2 id="compare-title">房源比較</h2>
      <p>比較 {selected.length} / 4 筆；比較清單保存在網址中。</p>
      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">項目</th>
              {selected.map((item) => (
                <th scope="col" key={item.id}>
                  <Link to={`/listings/${encodeURIComponent(item.id)}`}>
                    {item.title ?? '未命名房源'}
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    aria-label={`移除 ${item.title ?? item.id}`}
                  >
                    移除
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, getValue]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {selected.map((item) => (
                  <td key={item.id}>{getValue(item)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
