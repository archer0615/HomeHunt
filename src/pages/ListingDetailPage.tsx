import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Listing, ListingEvent, PriceHistory } from '../../shared/domain';
import { StatusView } from '../components/StatusView';
import { usePersonalState } from '../personal-state/context';

const labels: Record<string, string> = {
  USED: '中古屋',
  NEW: '新成屋',
  PRESALE: '預售屋',
  UNKNOWN: '未知',
  ACTIVE: '上架中',
  MISSING: '暫時找不到',
  DELISTED: '已下架',
  LISTING_DISCOVERED: '首次發現',
  PRICE_DECREASED: '降價',
  PRICE_INCREASED: '漲價',
  MARKED_MISSING: '標記暫失',
  RESTORED: '恢復上架',
  RELISTED: '重新上架',
  CONTENT_CHANGED: '房源內容更新',
};
const value = (item: unknown) => (item === undefined || item === null ? '未提供' : String(item));
const price = (listing: Listing) =>
  listing.totalPrice !== undefined
    ? `${listing.totalPrice.toLocaleString()} 元`
    : listing.minTotalPrice !== undefined || listing.maxTotalPrice !== undefined
      ? `${value(listing.minTotalPrice?.toLocaleString())}～${value(listing.maxTotalPrice?.toLocaleString())} 元`
      : '未提供';
const area = (exact: number | undefined, min: number | undefined, max: number | undefined) =>
  exact !== undefined
    ? `${exact} 坪`
    : min !== undefined || max !== undefined
      ? `${value(min)}～${value(max)} 坪`
      : '未提供';
const date = (input: string) => new Date(input).toLocaleString('zh-TW');
const daysOnMarket = (listing: Listing) => {
  const end = listing.delistedAt ?? listing.lastSeenAt;
  const days = Math.max(
    0,
    Math.floor((Date.parse(end) - Date.parse(listing.firstSeenAt)) / 86_400_000),
  );
  return `${days} 天`;
};
export function ListingDetailPage({
  listings,
  histories,
  events,
}: {
  listings: Listing[];
  histories: PriceHistory[];
  events: ListingEvent[];
}) {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const listing = listings.find((item) => item.id === decodeURIComponent(listingId ?? ''));
  const { ready, states, toggleFavorite, toggleVisited, exclude, undoExclude } = usePersonalState();
  const [undo, setUndo] = useState(false);
  if (!ready) return <StatusView title="正在載入個人狀態" message="正在準備房源操作…" />;
  if (!listing)
    return (
      <StatusView
        title="找不到此房源"
        message="這筆房源不在目前公開資料中。"
        actionLabel="返回搜尋"
        onAction={() => navigate('/')}
      />
    );
  const state = states[listing.id];
  const history = histories.filter((item) => item.listingId === listing.id);
  const timeline = events.filter((item) => item.listingId === listing.id);
  const priceEvents = timeline.filter(
    (item) => item.eventType === 'PRICE_DECREASED' || item.eventType === 'PRICE_INCREASED',
  );
  return (
    <article className="detail-page">
      <Link to="/">← 返回搜尋</Link>
      <header className="detail-header">
        <p className="eyebrow">
          {listing.sourceId} · {labels[listing.listingType] ?? listing.listingType}
        </p>
        <h1>{listing.title ?? '未命名房源'}</h1>
        <p className={`status status-${listing.status.toLowerCase()}`}>{labels[listing.status]}</p>
        <strong className="detail-price">{price(listing)}</strong>
        <p>
          {listing.unitPrice !== undefined
            ? `單價 ${listing.unitPrice.toLocaleString()} 元/坪`
            : listing.minUnitPrice !== undefined || listing.maxUnitPrice !== undefined
              ? `單價 ${value(listing.minUnitPrice?.toLocaleString())}～${value(listing.maxUnitPrice?.toLocaleString())} 元/坪`
              : '單價未提供'}
        </p>
      </header>
      <div className="personal-actions detail-actions">
        <button type="button" onClick={() => void toggleFavorite(listing.id)}>
          {state?.favorite ? '已收藏' : '收藏'}
        </button>
        <button type="button" onClick={() => void toggleVisited(listing.id)}>
          {state?.visited ? '已看屋' : '標記已看屋'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('確定要永久排除這筆房源嗎？'))
              void exclude(listing.id).then(() => setUndo(true));
          }}
        >
          排除
        </button>
        {undo || state?.excluded ? (
          <button
            type="button"
            onClick={() => void undoExclude(listing.id).then(() => setUndo(false))}
          >
            復原排除
          </button>
        ) : null}
      </div>
      <section>
        <h2>圖片</h2>
        {listing.images?.length ? (
          <div className="listing-images">
            {listing.images.map((image) => (
              <img key={image} src={image} alt="房源照片" loading="lazy" />
            ))}
          </div>
        ) : (
          <p>圖片未提供。</p>
        )}
      </section>
      <section>
        <h2>房屋資訊</h2>
        <dl className="detail-grid">
          {[
            [
              '地區',
              [listing.city, listing.district, listing.address].filter(Boolean).join(' · ') ||
                undefined,
            ],
            ['房屋類型', labels[listing.listingType] ?? listing.listingType],
            [
              '權狀坪數',
              area(listing.buildingArea, listing.minBuildingArea, listing.maxBuildingArea),
            ],
            ['室內坪數', listing.mainArea],
            ['附屬坪數', listing.auxiliaryArea],
            [
              '格局',
              listing.rooms === undefined
                ? undefined
                : `${listing.rooms} 房 ${value(listing.halls)} 廳 ${value(listing.bathrooms)} 衛`,
            ],
            [
              '樓層',
              listing.floor === undefined
                ? undefined
                : `${listing.floor} / ${value(listing.totalFloors)} 樓`,
            ],
            ['屋齡', listing.buildingAge === undefined ? undefined : `${listing.buildingAge} 年`],
            ['建物型態', listing.buildingType],
            [
              '電梯',
              listing.hasElevator === undefined ? undefined : listing.hasElevator ? '有' : '無',
            ],
            [
              '車位',
              listing.hasParking === undefined
                ? undefined
                : listing.hasParking
                  ? value(listing.parkingType)
                  : '無',
            ],
            [
              '管理費',
              listing.managementFee === undefined
                ? undefined
                : `${listing.managementFee.toLocaleString()} 元`,
            ],
            ['捷運', listing.nearestMrtStation],
            ['首次發現', date(listing.firstSeenAt)],
            ['上市天數', daysOnMarket(listing)],
            ['最近更新', date(listing.updatedAt)],
          ].map(([key, val]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value(val)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section>
        <h2>價格歷史</h2>
        {history.length ? (
          <ol className="timeline">
            {history.map((item) => (
              <li key={item.id}>
                {date(item.observedAt)}：
                {price({
                  ...listing,
                  totalPrice: item.totalPrice,
                  minTotalPrice: undefined,
                  maxTotalPrice: undefined,
                })}
              </li>
            ))}
          </ol>
        ) : (
          <p>尚無價格歷史。</p>
        )}
      </section>
      <section>
        <h2>房源事件</h2>
        {timeline.length ? (
          <ol className="timeline">
            {timeline.map((item) => (
              <li key={item.id}>
                {date(item.occurredAt)}：{labels[item.eventType] ?? item.eventType}
              </li>
            ))}
          </ol>
        ) : (
          <p>尚無事件紀錄。</p>
        )}
      </section>
      <section>
        <h2>價格變化</h2>
        {priceEvents.length ? (
          <ul className="timeline">
            {priceEvents.map((event) => (
              <li key={event.id}>
                {date(event.occurredAt)}：{labels[event.eventType]}（{value(event.oldValue)} →{' '}
                {value(event.newValue)}）
              </li>
            ))}
          </ul>
        ) : (
          <p>尚無價格變化紀錄。</p>
        )}
      </section>
      <section>
        <h2>來源</h2>
        <p>{listing.sourceId}</p>
        {listing.sourceUrl ? (
          <a href={listing.sourceUrl} target="_blank" rel="noopener noreferrer">
            查看原始房源
          </a>
        ) : (
          <p>原始連結未提供。</p>
        )}
      </section>
    </article>
  );
}
