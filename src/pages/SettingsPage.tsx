import { usePersonalState } from '../personal-state/context';
import type { Listing } from '../../shared/domain';

export function SettingsPage({ listings }: { listings: Listing[] }) {
  const { states, ready, undoExclude } = usePersonalState();
  const excluded = listings.filter((item) => states[item.id]?.excluded);
  return (
    <section aria-labelledby="settings-title">
      <h2 id="settings-title">設定</h2>
      <p>HomeHunt 目前以本機資料與本機個人狀態運作。</p>
      <dl className="data-summary">
        <div>
          <dt>個人狀態</dt>
          <dd>{ready ? '已準備' : '載入中'}</dd>
        </div>
        <div>
          <dt>永久排除</dt>
          <dd>{excluded.length} 筆</dd>
        </div>
      </dl>
      {excluded.length ? (
        <ul className="listing-results">
          {excluded.map((item) => (
            <li key={item.id} className="listing-card">
              <span>{item.title ?? '未命名房源'}</span>
              <button type="button" onClick={() => void undoExclude(item.id)}>
                恢復房源
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">目前沒有永久排除的房源。</p>
      )}
    </section>
  );
}
