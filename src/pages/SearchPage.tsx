import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { Listing, ListingEvent } from '../../shared/domain';
import { EmptyState } from '../components/StatusView';
import { searchListings, warningsFor, type SortOption } from '../search/engine';
import { addCompareId, compareIdsFromUrl } from '../search/market-reference';
import { decisionScore, findPossibleDuplicates, matchFactors } from '../search/decision';
import {
  criteriaFromSearch,
  criteriaToSearch,
  loadSearchPresets,
  saveSearchPresets,
} from '../search/url';
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
  { value: 'BEST_MATCH', label: '符合條件度' },
];
const price = (item: Listing) =>
  item.totalPrice !== undefined
    ? `${(item.totalPrice / 10000).toLocaleString()} 萬`
    : item.minTotalPrice !== undefined || item.maxTotalPrice !== undefined
      ? `${((item.minTotalPrice ?? 0) / 10000).toLocaleString()}～${((item.maxTotalPrice ?? 0) / 10000).toLocaleString()} 萬`
      : '價格未提供';

function RangeControls({
  label,
  prefix,
  range,
  update,
}: {
  label: string;
  prefix: string;
  range?: { min?: number; max?: number };
  update: (name: string, value: string) => void;
}) {
  return (
    <fieldset className="range-filter">
      <legend>{label}</legend>
      <label>
        最低
        <input
          aria-label={`${label}最低`}
          type="number"
          value={range?.min ?? ''}
          onChange={(event) => update(`${prefix}Min`, event.target.value)}
        />
      </label>
      <label>
        最高
        <input
          aria-label={`${label}最高`}
          type="number"
          value={range?.max ?? ''}
          onChange={(event) => update(`${prefix}Max`, event.target.value)}
        />
      </label>
    </fieldset>
  );
}

export function SearchPage({
  listings,
  events = [],
}: {
  listings: Listing[];
  events?: ListingEvent[];
}) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const criteria = criteriaFromSearch(params.toString());
  const requestedSort = params.get('sort') as SortOption | null;
  const sort: SortOption =
    requestedSort && sortOptions.some((option) => option.value === requestedSort)
      ? requestedSort
      : 'NEWEST';
  const [presets, setPresets] = useState(() => loadSearchPresets());
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
  const compareIds = compareIdsFromUrl(params.get('compare'));
  const duplicateCandidates = useMemo(() => findPossibleDuplicates(listings), [listings]);
  const hasCriteria = Object.values(criteria).some((value) =>
    Array.isArray(value) ? value.length > 0 : value !== undefined,
  );
  const addToCompare = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('compare', addCompareId(compareIds, id).join(','));
    setParams(next);
  };
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
  const changeSort = (value: string) => update('sort', value === 'NEWEST' ? '' : value);
  const applyPreset = (query: string) => {
    const next = new URLSearchParams(query);
    const compare = params.get('compare');
    if (compare) next.set('compare', compare);
    navigate({ search: next.toString() });
  };
  const savePreset = () => {
    const name = window.prompt('請輸入這組搜尋條件的名稱。')?.trim();
    if (!name) return;
    const next = [
      ...presets.filter((preset) => preset.name !== name),
      { name, query: criteriaToSearch(criteria) },
    ];
    setPresets(next);
    saveSearchPresets(next);
  };
  const cities = [
    ...new Set(
      listings.map((item) => item.city).filter((value): value is string => Boolean(value)),
    ),
  ].sort();
  const districts = [
    ...new Set(
      listings
        .filter((item) => !criteria.city || item.city === criteria.city)
        .map((item) => item.district)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort();
  const mrtStations = [
    ...new Set(
      listings
        .map((item) => item.nearestMrtStation)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort();
  return (
    <section aria-labelledby="search-title">
      <div className="page-intro">
        <p className="eyebrow">搜尋房源</p>
        <h2 id="search-title">找到下一個日常落腳處</h2>
      </div>
      <section className="search-presets" aria-label="已儲存的搜尋條件">
        <button type="button" onClick={savePreset}>
          儲存目前條件
        </button>
        {presets.map((preset) => (
          <span key={preset.name}>
            <button type="button" onClick={() => applyPreset(preset.query)}>
              {preset.name}
            </button>
            <button
              type="button"
              aria-label={`刪除搜尋條件 ${preset.name}`}
              onClick={() => {
                const next = presets.filter((item) => item.name !== preset.name);
                setPresets(next);
                saveSearchPresets(next);
              }}
            >
              刪除
            </button>
          </span>
        ))}
      </section>
      <form className="search-controls" onSubmit={(event) => event.preventDefault()}>
        <label>
          縣市
          <select
            value={criteria.city ?? ''}
            onChange={(event) => {
              const next = new URLSearchParams(params);
              if (event.target.value) next.set('city', event.target.value);
              else next.delete('city');
              next.delete('districts');
              navigate({ search: next.toString() });
            }}
          >
            <option value="">不限</option>
            {cities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
        </label>
        <label>
          行政區（可多選）
          <select
            multiple
            value={criteria.districts ?? []}
            onChange={(event) =>
              update(
                'districts',
                [...event.currentTarget.selectedOptions].map((option) => option.value).join(','),
              )
            }
          >
            {districts.map((district) => (
              <option key={district}>{district}</option>
            ))}
          </select>
        </label>
        <label>
          捷運站（可多選）
          <select
            multiple
            value={criteria.mrtStations ?? []}
            onChange={(event) =>
              update(
                'mrt',
                [...event.currentTarget.selectedOptions].map((option) => option.value).join(','),
              )
            }
          >
            {mrtStations.map((station) => (
              <option key={station}>{station}</option>
            ))}
          </select>
        </label>
        <RangeControls
          label="總價（元）"
          prefix="price"
          range={criteria.totalPrice}
          update={update}
        />
        <RangeControls
          label="單價（元/坪）"
          prefix="unitPrice"
          range={criteria.unitPrice}
          update={update}
        />
        <RangeControls
          label="室內坪數"
          prefix="mainArea"
          range={criteria.mainArea}
          update={update}
        />
        <RangeControls
          label="權狀坪數"
          prefix="buildingArea"
          range={criteria.buildingArea}
          update={update}
        />
        <RangeControls
          label="屋齡（年）"
          prefix="age"
          range={criteria.buildingAge}
          update={update}
        />
        <RangeControls label="樓層" prefix="floor" range={criteria.floor} update={update} />
        <RangeControls
          label="管理費（元/月）"
          prefix="fee"
          range={criteria.managementFee}
          update={update}
        />
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
            multiple
            value={criteria.parkingTypes ?? []}
            onChange={(event) =>
              update(
                'parking',
                [...event.currentTarget.selectedOptions].map((option) => option.value).join(','),
              )
            }
          >
            <option value="RAMP_FLAT">坡道平面</option>
            <option value="RAMP_MECHANICAL">坡道機械</option>
            <option value="LIFT_FLAT">昇降平面</option>
            <option value="LIFT_MECHANICAL">昇降機械</option>
          </select>
        </label>
        <label>
          房屋類型
          <select
            multiple
            value={criteria.listingTypes ?? []}
            onChange={(event) =>
              update(
                'types',
                [...event.currentTarget.selectedOptions].map((option) => option.value).join(','),
              )
            }
          >
            <option value="USED">中古屋</option>
            <option value="NEW">新成屋</option>
            <option value="PRESALE">預售屋</option>
            <option value="UNKNOWN">未知</option>
          </select>
        </label>
        <label>
          建物型態
          <select
            multiple
            value={criteria.buildingTypes ?? []}
            onChange={(event) =>
              update(
                'buildingTypes',
                [...event.currentTarget.selectedOptions].map((option) => option.value).join(','),
              )
            }
          >
            <option value="RESIDENTIAL_HIGHRISE">大樓</option>
            <option value="MIDRISE">華廈</option>
            <option value="APARTMENT">公寓</option>
            <option value="TOWNHOUSE">透天</option>
            <option value="STUDIO">套房</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() =>
            navigate({
              search: params.get('compare')
                ? `compare=${encodeURIComponent(params.get('compare')!)}`
                : '',
            })
          }
        >
          清除條件
        </button>
        <label>
          排序
          <select value={sort} onChange={(event) => changeSort(event.target.value)}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </form>
      <p className="result-count">符合 {results.length} 筆</p>
      {sort === 'BEST_MATCH' && !hasCriteria ? (
        <p role="status">設定一項以上的搜尋條件後，會顯示符合度排序。</p>
      ) : null}
      {hasCriteria ? (
        <p className="muted">符合度只比較目前設定的篩選條件，各條件等權；不代表估價或整體品質。</p>
      ) : null}
      <p>
        <Link to={`/compare?ids=${encodeURIComponent(compareIds.join(','))}`}>
          房源比較（{compareIds.length}/4）
        </Link>
      </p>
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
                {hasCriteria ? (
                  <p className="match-score">
                    符合度 {decisionScore(item, criteria)}% · 根據{' '}
                    {matchFactors(item, criteria)
                      .map((factor) => factor.label)
                      .join('、')}
                  </p>
                ) : null}
                {duplicateCandidates.get(item.id)?.length ? (
                  <p className="possible-duplicate">
                    疑似同一物件，請人工核對：{' '}
                    {duplicateCandidates.get(item.id)?.map((candidate) => (
                      <Link key={candidate.id} to={`/listings/${encodeURIComponent(candidate.id)}`}>
                        {candidate.sourceId} · {candidate.title ?? '未命名房源'}
                      </Link>
                    ))}
                  </p>
                ) : null}
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
                  <button
                    type="button"
                    disabled={compareIds.includes(item.id) || compareIds.length >= 4}
                    onClick={() => addToCompare(item.id)}
                  >
                    {compareIds.includes(item.id) ? '已加入比較' : '加入比較'}
                  </button>
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
