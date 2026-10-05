import { useRef, useState } from 'react';
import { publicationMetadataSchema, type PublicationMetadata } from '../../shared/schemas';
import type { Listing } from '../../shared/domain';
import { parsePersonalStateBackup, serializePersonalStateBackup } from '../personal-state/backup';
import { usePersonalState } from '../personal-state/context';

export function SettingsPage({
  listings,
  metadata,
}: {
  listings: Listing[];
  metadata: PublicationMetadata;
}) {
  const { states, ready, undoExclude, restoreAll } = usePersonalState();
  const [message, setMessage] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const excluded = Object.values(states).filter((state) => state.excluded);
  const missingPrice = listings.filter(
    (item) =>
      item.totalPrice === undefined &&
      item.minTotalPrice === undefined &&
      item.maxTotalPrice === undefined,
  ).length;
  const missingArea = listings.filter(
    (item) =>
      item.buildingArea === undefined &&
      item.minBuildingArea === undefined &&
      item.maxBuildingArea === undefined,
  ).length;
  const missingLocation = listings.filter((item) => !item.city || !item.district).length;
  const hasFixtureListings = listings.some((item) => item.sourceListingId.startsWith('fixture-'));
  const exportState = () => {
    const blob = new Blob([serializePersonalStateBackup(Object.values(states))], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `homehunt-personal-state-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('個人狀態備份已下載。');
  };
  const importState = async (file?: File) => {
    if (!file) return;
    try {
      const imported = parsePersonalStateBackup(JSON.parse(await file.text()));
      if (!window.confirm(`將以備份中的 ${imported.length} 筆狀態取代目前本機狀態，確定嗎？`))
        return;
      await restoreAll(imported);
      setMessage(`已還原 ${imported.length} 筆個人狀態。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '無法讀取備份檔。');
    } finally {
      if (input.current) input.current.value = '';
    }
  };
  const metadataResult = publicationMetadataSchema.safeParse(metadata);
  const sources = metadataResult.success ? metadataResult.data.sources : [];
  const sourceNames: Record<string, string> = {
    moi: '內政部實價登錄',
    '591-sale': '591 中古屋',
    '591-newhouse': '591 新成屋／預售屋',
  };
  return (
    <section aria-labelledby="settings-title">
      <h2 id="settings-title">設定與資料狀態</h2>
      <p>HomeHunt 目前以本機資料與本機個人狀態運作。</p>
      {hasFixtureListings ? (
        <p className="data-notice" role="status">
          目前房源資料包含 fixture 範例資料，僅供功能測試，不代表即時來源房源。
        </p>
      ) : null}
      <dl className="data-summary">
        <div>
          <dt>個人狀態</dt>
          <dd>{ready ? '已準備' : '載入中'}</dd>
        </div>
        <div>
          <dt>公開房源</dt>
          <dd>{listings.length.toLocaleString()} 筆</dd>
        </div>
        <div>
          <dt>成交資料</dt>
          <dd>{metadata.counts.transactions.toLocaleString()} 筆</dd>
        </div>
        <div>
          <dt>缺少地區</dt>
          <dd>{missingLocation.toLocaleString()} 筆</dd>
        </div>
        <div>
          <dt>缺少價格</dt>
          <dd>{missingPrice.toLocaleString()} 筆</dd>
        </div>
        <div>
          <dt>缺少坪數</dt>
          <dd>{missingArea.toLocaleString()} 筆</dd>
        </div>
        <div>
          <dt>永久排除</dt>
          <dd>{excluded.length} 筆</dd>
        </div>
        <div>
          <dt>公開資料產生時間（不代表來源即時性）</dt>
          <dd>{new Date(metadata.generatedAt).toLocaleString('zh-TW')}</dd>
        </div>
        <div>
          <dt>資料版本</dt>
          <dd>{metadata.appDataVersion.slice(0, 20)}</dd>
        </div>
      </dl>
      <section aria-labelledby="source-status-title">
        <h3 id="source-status-title">來源更新狀態</h3>
        <p>
          以下為最近一次發布時記錄的狀態；591 即時收集目前暫停，MOI 即時下載仍須符合官方授權條件。
        </p>
        {sources.length ? (
          <ul>
            {sources.map((source) => (
              <li key={source.sourceId}>
                {sourceNames[source.sourceId] ?? source.sourceId}：{source.status}，
                {source.itemCount.toLocaleString()} 筆
                {source.lastAttemptAt
                  ? `，嘗試時間 ${new Date(source.lastAttemptAt).toLocaleString('zh-TW')}`
                  : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p>目前沒有來源更新紀錄。</p>
        )}
      </section>
      <section aria-labelledby="state-backup-title">
        <h3 id="state-backup-title">個人狀態備份</h3>
        <p>備份只包含本機收藏、排除、已看屋及標籤，不包含房源公開資料。</p>
        <button type="button" onClick={exportState}>
          下載備份
        </button>{' '}
        <button type="button" onClick={() => input.current?.click()}>
          還原備份
        </button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => void importState(event.target.files?.[0])}
        />
        {message ? <p role="status">{message}</p> : null}
      </section>
      <section aria-labelledby="excluded-title">
        <h3 id="excluded-title">永久排除（{excluded.length} 筆）</h3>
        {excluded.length ? (
          <ul className="listing-results">
            {excluded.map((state) => {
              const item = listings.find((listing) => listing.id === state.listingId);
              return (
                <li key={state.listingId} className="listing-card">
                  <span>{item?.title ?? state.listingId}</span>
                  <button type="button" onClick={() => void undoExclude(state.listingId)}>
                    恢復房源
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">目前沒有永久排除的房源。</p>
        )}
      </section>
    </section>
  );
}
