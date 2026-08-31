import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { Listing, ListingEvent } from '../../shared/domain';
import { EmptyState } from '../components/StatusView';
import { searchListings, warningsFor, type SortOption } from '../search/engine';
import { criteriaFromSearch } from '../search/url';
import { usePersonalState } from '../personal-state/context';
import { StatusView } from '../components/StatusView';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'NEWEST', label: '最新上架' },
  { value: 'UPDATED', label: '最近更新' },
  { value: 'PRICE_ASC', label: '總價低到高' },
  { value: 'PRICE_DESC', label: '總價高到低' },
  { value: 'UNIT_PRICE_ASC', label: '單價低到高' },
  { value: 'UNIT_PRICE_DESC', label: '單價高到低' },
  { value: 'AREA_DESC', label: '室內坪數大到小' },
  { value: 'AGE_ASC', label: '屋齡新到舊' },
  { value: 'PRICE_DROP', label: '最近降價' },
];
const price = (item: Listing) =>
  item.totalPrice !== undefined
    ? `${(item.totalPrice / 10000).toLocaleString()} 萬`
    : item.minTotalPrice !== undefined || item.maxTotalPrice !== undefined
      ? `${((item.minTotalPrice ?? 0) / 10000).toLocaleString()}～${((item.maxTotalPrice ?? 0) / 10000).toLocaleString()} 萬`
      : '價格未提供';

export function SearchPage({
  listings,
  events = [],
}: {
  listings: Listing[];
  events?: ListingEvent[];
}) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const criteria = criteriaFromSearch(params.toString());
  const [sort, setSort] = useState<SortOption>('NEWEST');
  const {
    ready,
    states,
    error: personalStateError,
    toggleFavorite,
    toggleVisited,
    exclude,
    undoExclude,
  } = usePersonalState();
  const [undoId, setUndoId] = useState<string>();
  const results = useMemo(() => {
    const priceDropAt = new Map(
      events
        .filter((event) => event.eventType === 'PRICE_DECREASED')
        .map((event) => [event.listingId, Date.parse(event.occurredAt)] as const),
    );
    return searchListings(
      listings.filter((item) => !states[item.id]?.excluded),
      criteria,
      sort,
      [],
      priceDropAt,
    );
  }, [listings, criteria, sort, states, events]);
  if (!ready) return <StatusView title="正在載入個人狀態" message="正在準備收藏與已看屋資料…" />;
  if (personalStateError)
    return (
      <StatusView title="個人狀態載入失敗" message="收藏與排除狀態無法使用，請重新整理後再試。" />
    );
  const update = (name: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    navigate({ search: next.toString() });
  };
  return (
    <section aria-labelledby="search-title">
      <div className="page-intro">
        <p className="eyebrow">搜尋房源</p>
        <h2 id="search-title">找到下一個日常落腳處</h2>
      </div>
      <form className="search-controls" onSubmit={(event) => event.preventDefault()}>
        <label>
          縣市
          <input
            value={criteria.city ?? ''}
            onChange={(event) => update('city', event.target.value)}
          />
        </label>
        <label>
          總價上限（元）
          <input
            type="number"
            value={criteria.totalPrice?.max ?? ''}
            onChange={(event) => update('priceMax', event.target.value)}
          />
        </label>
        <label>
          至少房數
          <input
            type="number"
            min="0"
            value={criteria.minRooms ?? ''}
            onChange={(event) => update('rooms', event.target.value)}
          />
        </label>
        <label>
          行政區
          <input
            value={criteria.districts?.join(',') ?? ''}
            onChange={(event) => update('districts', event.target.value)}
          />
        </label>
        <label>
          捷運站（可多選，以逗號分隔）
          <input
            value={criteria.mrtStations?.join(',') ?? ''}
            onChange={(event) => update('mrt', event.target.value)}
          />
        </label>
        <label>
          單價上限（元/坪）
          <input
            type="number"
            value={criteria.unitPrice?.max ?? ''}
            onChange={(event) => update('unitPriceMax', event.target.value)}
          />
        </label>
        <label>
          管理費上限（元/月）
          <input
            type="number"
            value={criteria.managementFee?.max ?? ''}
            onChange={(event) => update('feeMax', event.target.value)}
          />
        </label>
        <label>
          室內坪數下限
          <input
            type="number"
            value={criteria.mainArea?.min ?? ''}
            onChange={(event) => update('mainAreaMin', event.target.value)}
          />
        </label>
        <label>
          權狀坪數下限
          <input
            type="number"
            value={criteria.buildingArea?.min ?? ''}
            onChange={(event) => update('buildingAreaMin', event.target.value)}
          />
        </label>
        <label>
          屋齡上限
          <input
            type="number"
            value={criteria.buildingAge?.max ?? ''}
            onChange={(event) => update('ageMax', event.target.value)}
          />
        </label>
        <label>
          樓層下限
          <input
            type="number"
            value={criteria.floor?.min ?? ''}
            onChange={(event) => update('floorMin', event.target.value)}
          />
        </label>
        <label>
          電梯
          <select
            value={criteria.hasElevator === undefined ? '' : String(criteria.hasElevator)}
            onChange={(event) => update('elevator', event.target.value)}
          >
            <option value="">不限</option>
            <option value="true">有電梯</option>
            <option value="false">無電梯</option>
          </select>
        </label>
        <label>
          車位
          <select
            value={criteria.hasParking === undefined ? '' : String(criteria.hasParking)}
            onChange={(event) => update('parkingRequired', event.target.value)}
          >
            <option value="">不限</option>
            <option value="true">有車位</option>
            <option value="false">無車位</option>
          </select>
        </label>
        <label>
          車位類型
          <select
            value={criteria.parkingTypes?.[0] ?? ''}
            onChange={(event) => update('parking', event.target.value)}
          >
            <option value="">不限</option>
            <option value="RAMP_FLAT">坡道平面</option>
            <option value="RAMP_MECHANICAL">坡道機械</option>
            <option value="LIFT_FLAT">昇降平面</option>
            <option value="LIFT_MECHANICAL">昇降機械</option>
          </select>
        </label>
        <label>
          房屋類型
          <select
            value={criteria.listingTypes?.[0] ?? ''}
            onChange={(event) => update('types', event.target.value)}
          >
            <option value="">不限</option>
            <option value="USED">中古屋</option>
            <option value="NEW">新成屋</option>
            <option value="PRESALE">預售屋</option>
            <option value="UNKNOWN">未知</option>
          </select>
        </label>
        <label>
          建物型態
          <select
            value={criteria.buildingTypes?.[0] ?? ''}
            onChange={(event) => update('buildingTypes', event.target.value)}
          >
            <option value="">不限</option>
            <option value="RESIDENTIAL_HIGHRISE">大樓</option>
            <option value="MIDRISE">華廈</option>
            <option value="APARTMENT">公寓</option>
            <option value="TOWNHOUSE">透天</option>
            <option value="STUDIO">套房</option>
          </select>
        </label>
        <button type="button" onClick={() => navigate({ search: '' })}>
          清除條件
        </button>
        <label>
          排序
          <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </form>
      <p className="result-count">符合 {results.length} 筆</p>
      {results.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="listing-results">
          {results.map((item) => (
            <li key={item.id}>
              <article className="listing-card">
                <p className="eyebrow">
                  {item.listingType} · {item.sourceId}
                </p>
                <h3>
                  <Link to={`/listings/${encodeURIComponent(item.id)}`}>
                    {item.title ?? '未命名房源'}
                  </Link>
                </h3>
                <p>
                  {[item.city, item.district, item.nearestMrtStation].filter(Boolean).join(' · ')}
                </p>
                {warningsFor(item).map((warning) => (
                  <p className="soft-warning" key={warning}>
                    ⚠ {warning}
                  </p>
                ))}
                <strong>{price(item)}</strong>
                <p>
                  {item.rooms !== undefined ? `${item.rooms} 房` : '格局未提供'}{' '}
                  {item.mainArea !== undefined
                    ? `室內 ${item.mainArea} 坪`
                    : item.buildingArea !== undefined
                      ? `權狀 ${item.buildingArea} 坪`
                      : ''}
                </p>
                <div className="personal-actions" aria-label={`${item.id} 個人操作`}>
                  <button type="button" onClick={() => void toggleFavorite(item.id)}>
                    {states[item.id]?.favorite ? '已收藏' : '收藏'}
                  </button>
                  <button type="button" onClick={() => void toggleVisited(item.id)}>
                    {states[item.id]?.visited ? '已看屋' : '標記已看屋'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('確定要永久排除這筆房源嗎？'))
                        void exclude(item.id).then(() => setUndoId(item.id));
                    }}
                  >
                    排除
                  </button>
                </div>
                {undoId === item.id ? (
                  <p>
                    <button
                      type="button"
                      onClick={() => void undoExclude(item.id).then(() => setUndoId(undefined))}
                    >
                      復原排除
                    </button>
                  </p>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
