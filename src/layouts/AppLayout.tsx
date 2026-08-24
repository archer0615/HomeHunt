import { NavLink, Outlet } from 'react-router-dom';
export function AppLayout() {
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
          <NavLink to="/settings">設定</NavLink>
        </nav>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="app-footer">公開資料僅供參考，請以來源頁面為準。</footer>
    </div>
  );
}
