import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StatusView } from './components/StatusView';
import { loadListings, loadMetadata, type PublicationMetadata } from './data/publication';
import { AppLayout } from './layouts/AppLayout';
import { SearchPage } from './pages/SearchPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { PersonalStateProvider } from './personal-state/context';
import './App.css';

function Application() {
  const [metadata, setMetadata] = useState<PublicationMetadata>();
  const [listings, setListings] = useState<import('../shared/domain').Listing[]>();
  const [error, setError] = useState<Error>();
  const load = () => {
    setError(undefined);
    void Promise.all([loadMetadata(), loadListings()])
      .then(([nextMetadata, nextListings]) => {
        setMetadata(nextMetadata);
        setListings(nextListings);
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason : new Error('metadata load failed')),
      );
  };
  useEffect(load, []);
  if (error)
    return (
      <StatusView
        title="公開資料載入失敗"
        message={error.message}
        actionLabel="重新載入"
        onAction={load}
      />
    );
  if (!metadata || !listings)
    return <StatusView title="正在準備 HomeHunt" message="正在載入最新公開資料…" />;
  return (
    <PersonalStateProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<SearchPage listings={listings} />} />
            <Route path="/search" element={<SearchPage listings={listings} />} />
            <Route path="/favorites" element={<PlaceholderPage title="收藏" />} />
            <Route path="/visited" element={<PlaceholderPage title="已看屋" />} />
            <Route path="/settings" element={<PlaceholderPage title="設定" />} />
          </Route>
        </Routes>
      </HashRouter>
    </PersonalStateProvider>
  );
}
export function App() {
  return (
    <ErrorBoundary>
      <Application />
    </ErrorBoundary>
  );
}
