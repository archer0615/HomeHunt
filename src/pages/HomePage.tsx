import type { PublicationMetadata } from '../../shared/schemas';
import { EmptyState } from '../components/StatusView';
export function HomePage({ metadata }: { metadata: PublicationMetadata }) {
  return (
    <section aria-labelledby="home-title">
      <div className="page-intro">
        <p className="eyebrow">搜尋入口</p>
        <h2 id="home-title">找到下一個日常落腳處</h2>
        <p>使用搜尋條件尋找房源，並查看價格、刊登狀態與本機追蹤資訊。</p>
      </div>
      <div className="data-summary">
        <strong>{metadata.counts.listings.toLocaleString()} 筆房源</strong>
        <span>資料版本 {metadata.appDataVersion.slice(0, 16)}</span>
      </div>
      {metadata.counts.listings === 0 ? (
        <EmptyState />
      ) : (
        <section className="placeholder-panel" aria-label="房源資料狀態">
          <h3>房源資料已載入</h3>
          <p>目前資料僅供本機瀏覽；來源狀態與資料產生時間請查看設定頁。</p>
        </section>
      )}
    </section>
  );
}
