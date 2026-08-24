import type { PublicationMetadata } from '../../shared/schemas';
import { EmptyState } from '../components/StatusView';
export function HomePage({ metadata }: { metadata: PublicationMetadata }) {
  return (
    <section aria-labelledby="home-title">
      <div className="page-intro">
        <p className="eyebrow">搜尋入口</p>
        <h2 id="home-title">找到下一個日常落腳處</h2>
        <p>搜尋、篩選與排序功能將在下一個階段接續加入。</p>
      </div>
      <div className="data-summary">
        <strong>{metadata.counts.listings.toLocaleString()} 筆房源</strong>
        <span>資料版本 {metadata.appDataVersion.slice(0, 16)}</span>
      </div>
      {metadata.counts.listings === 0 ? (
        <EmptyState />
      ) : (
        <section className="placeholder-panel" aria-label="房源資料狀態">
          <h3>房源資料已準備</h3>
          <p>目前先呈現應用程式基礎；房源搜尋介面將在 Phase 09 建立。</p>
        </section>
      )}
    </section>
  );
}
