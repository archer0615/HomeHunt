import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { PublicationMetadata } from '../data/publication';
export function AppLayout({ metadata }: { metadata: PublicationMetadata }) {
  const [updateReady, setUpdateReady] = useState(false);
  useEffect(() => {
    const serviceWorker = navigator.serviceWorker;
    if (!serviceWorker) return;
    void serviceWorker.ready.then((registration) => {
      if (registration.waiting) setUpdateReady(true);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && serviceWorker.controller) setUpdateReady(true);
        });
      });
    });
  }, []);
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">HOMEHUNT</p>
          <h1>找一個適合生活的家</h1>
        </div>
        <nav aria-label="主要導覽">
          <NavLink to="/" end>
            搜尋房源
          </NavLink>
          <NavLink to="/favorites">收藏</NavLink>
          <NavLink to="/visited">已看屋</NavLink>
          <NavLink to="/recent-price-drops">最近降價</NavLink>
          <NavLink to="/settings">設定</NavLink>
        </nav>
      </header>
      <main className="main-content">
        {updateReady ? (
          <div className="update-prompt" role="status">
            有新版 HomeHunt 可用，
            <button type="button" onClick={() => window.location.reload()}>
              重新載入
            </button>
          </div>
        ) : null}
        <Outlet />
      </main>
      <footer className="app-footer">
        資料版本 {metadata.appDataVersion.slice(0, 16)} · 最後更新{' '}
        {new Date(metadata.generatedAt).toLocaleString('zh-TW')}
        <br />
        公開資料僅供參考，請以來源頁面為準。
      </footer>
    </div>
  );
}
