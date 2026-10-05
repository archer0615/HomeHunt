import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Listing, ListingEvent } from '../../shared/domain';
import { EmptyState } from '../components/StatusView';
import { usePersonalState } from '../personal-state/context';

export function CollectionPage({
  title,
  listings,
  events = [],
  mode,
}: {
  title: string;
  listings: Listing[];
  events?: ListingEvent[];
  mode: 'favorite' | 'visited' | 'recent';
}) {
  const { ready, states, error, toggleFavorite, toggleVisited, setTags } = usePersonalState();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<
    | 'NEWEST'
    | 'PRICE_ASC'
    | 'PRICE_DESC'
    | 'UNIT_PRICE_ASC'
    | 'UNIT_PRICE_DESC'
    | 'AREA_DESC'
    | 'AGE_ASC'
  >('NEWEST');
  const selected = useMemo(() => {
    const priceDropIds = new Set(
      events
        .filter((event) => event.eventType === 'PRICE_DECREASED')
        .map((event) => event.listingId),
    );
    const needle = query.trim().toLocaleLowerCase();
    return listings
      .filter((item) => (mode === 'recent' ? priceDropIds.has(item.id) : states[item.id]?.[mode]))
      .filter(
        (item) =>
          !needle ||
          [
            item.title,
            item.city,
            item.district,
            item.address,
            ...(states[item.id]?.tags ?? []),
          ].some((value) => value?.toLocaleLowerCase().includes(needle)),
      )
      .sort((left, right) => {
        if (sort !== 'NEWEST') {
          const values = {
            PRICE_ASC: [
              left.totalPrice ?? left.minTotalPrice,
              right.totalPrice ?? right.minTotalPrice,
            ],
            PRICE_DESC: [
              left.totalPrice ?? left.maxTotalPrice,
              right.totalPrice ?? right.maxTotalPrice,
            ],
            UNIT_PRICE_ASC: [
              left.unitPrice ?? left.minUnitPrice,
              right.unitPrice ?? right.minUnitPrice,
            ],
            UNIT_PRICE_DESC: [
              left.unitPrice ?? left.maxUnitPrice,
              right.unitPrice ?? right.maxUnitPrice,
            ],
            AREA_DESC: [
              left.mainArea ?? left.buildingArea ?? left.maxBuildingArea,
              right.mainArea ?? right.buildingArea ?? right.maxBuildingArea,
            ],
            AGE_ASC: [left.buildingAge, right.buildingAge],
          } satisfies Record<
            Exclude<typeof sort, 'NEWEST'>,
            [number | undefined, number | undefined]
          >;
          const [a, b] = values[sort];
          if (a === undefined || b === undefined) return a === b ? 0 : a === undefined ? 1 : -1;
          const ascending = sort === 'PRICE_ASC' || sort === 'UNIT_PRICE_ASC' || sort === 'AGE_ASC';
          return (a - b) * (ascending ? 1 : -1);
        }
        return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
      });
  }, [events, listings, mode, query, sort, states]);
  if (!ready)
    return (
      <section aria-labelledby="collection-title">
        <h2 id="collection-title">{title}</h2>
        <p role="status">正在載入個人狀態…</p>
      </section>
    );
  if (error)
    return (
      <section aria-labelledby="collection-title">
        <h2 id="collection-title">{title}</h2>
        <p role="alert">個人狀態目前無法載入。</p>
      </section>
    );
  return (
    <section aria-labelledby="collection-title">
      <h2 id="collection-title">{title}</h2>
      <div className="collection-controls">
        <label>
          搜尋清單
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="標題、縣市、行政區或地址"
          />
        </label>
        <label>
          排序
          <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
            <option value="NEWEST">最近更新</option>
            <option value="PRICE_ASC">總價由低到高</option>
            <option value="PRICE_DESC">總價由高到低</option>
            <option value="UNIT_PRICE_ASC">單價由低到高</option>
            <option value="UNIT_PRICE_DESC">單價由高到低</option>
            <option value="AREA_DESC">室內坪數由大到小</option>
            <option value="AGE_ASC">屋齡新到舊</option>
          </select>
        </label>
      </div>
      <p>{selected.length} 筆</p>
      {selected.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="listing-results">
          {selected.map((item) => (
            <li key={item.id} className="listing-card">
              <Link to={`/listings/${encodeURIComponent(item.id)}`}>
                {item.title ?? '未命名房源'}
              </Link>
              <p>{[item.city, item.district].filter(Boolean).join(' · ') || '地區未提供'}</p>
              {states[item.id]?.tags?.length ? (
                <p>標籤：{states[item.id]?.tags?.join('、')}</p>
              ) : null}
              {mode !== 'recent' ? (
                <button
                  type="button"
                  onClick={() => {
                    const current = states[item.id]?.tags ?? [];
                    const input = window.prompt('以逗號分隔輸入標籤。', current.join(', '));
                    if (input !== null)
                      void setTags(item.id, [
                        ...new Set(
                          input
                            .split(',')
                            .map((tag) => tag.trim())
                            .filter(Boolean),
                        ),
                      ]);
                  }}
                >
                  編輯標籤
                </button>
              ) : null}{' '}
              {item.totalPrice !== undefined ? (
                <p>總價 {(item.totalPrice / 10000).toLocaleString()} 萬</p>
              ) : null}
              {mode === 'favorite' ? (
                <button type="button" onClick={() => void toggleFavorite(item.id)}>
                  取消收藏
                </button>
              ) : null}
              {mode === 'visited' ? (
                <button type="button" onClick={() => void toggleVisited(item.id)}>
                  取消已看屋
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
