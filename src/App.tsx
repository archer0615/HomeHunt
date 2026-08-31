import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StatusView } from './components/StatusView';
import { loadPublishedDataset, type PublicationMetadata } from './data/publication';
import { AppLayout } from './layouts/AppLayout';
import { SearchPage } from './pages/SearchPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { CollectionPage } from './pages/CollectionPage';
import { SettingsPage } from './pages/SettingsPage';
import { PersonalStateProvider } from './personal-state/context';
import './App.css';

function Application() {
  const [metadata, setMetadata] = useState<PublicationMetadata>();
  const [dataset, setDataset] =
    useState<Awaited<ReturnType<typeof loadPublishedDataset>>['dataset']>();
  const [offline, setOffline] = useState(false);
  const [browserOffline, setBrowserOffline] = useState(
    () => typeof navigator !== 'undefined' && !navigator.onLine,
  );
  const [error, setError] = useState<Error>();
  const load = () => {
    setError(undefined);
    void loadPublishedDataset()
      .then(({ metadata: nextMetadata, dataset: nextDataset, offline: nextOffline }) => {
        setMetadata(nextMetadata);
        setDataset(nextDataset);
        setOffline(nextOffline);
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason : new Error('metadata load failed')),
      );
  };
  useEffect(load, []);
  useEffect(() => {
    const offline = () => setBrowserOffline(true);
    const online = () => setBrowserOffline(false);
    window.addEventListener('offline', offline);
    window.addEventListener('online', online);
    return () => {
      window.removeEventListener('offline', offline);
      window.removeEventListener('online', online);
    };
  }, []);
  if (error)
    return (
      <StatusView
        title="公開資料載入失敗"
        message={error.message}
        actionLabel="重新載入"
        onAction={load}
      />
    );
  if (!metadata || !dataset)
    return <StatusView title="正在準備 HomeHunt" message="正在載入最新公開資料…" />;
  return (
    <PersonalStateProvider>
      <HashRouter>
        {offline || browserOffline ? (
          <div className="offline-indicator" role="status">
            離線模式
          </div>
        ) : null}
        <Routes>
          <Route element={<AppLayout metadata={metadata} />}>
            <Route
              path="/"
              element={<SearchPage listings={dataset.listings} events={dataset.events} />}
            />
            <Route
              path="/search"
              element={<SearchPage listings={dataset.listings} events={dataset.events} />}
            />
            <Route
              path="/listings/:listingId"
              element={
                <ListingDetailPage
                  listings={dataset.listings}
                  histories={dataset.priceHistory}
                  events={dataset.events}
                />
              }
            />
            <Route
              path="/favorites"
              element={<CollectionPage title="收藏" listings={dataset.listings} mode="favorite" />}
            />
            <Route
              path="/visited"
              element={<CollectionPage title="已看屋" listings={dataset.listings} mode="visited" />}
            />
            <Route
              path="/recent-price-drops"
              element={
                <CollectionPage title="最近降價" listings={dataset.listings} mode="recent" />
              }
            />
            <Route path="/settings" element={<SettingsPage listings={dataset.listings} />} />
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
