import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StatusView } from './components/StatusView';
import { loadListingDetailData, loadMetadata, type PublicationMetadata } from './data/publication';
import { AppLayout } from './layouts/AppLayout';
import { SearchPage } from './pages/SearchPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { PersonalStateProvider } from './personal-state/context';
import './App.css';

function Application() {
  const [metadata, setMetadata] = useState<PublicationMetadata>();
  const [dataset, setDataset] = useState<Awaited<ReturnType<typeof loadListingDetailData>>>();
  const [error, setError] = useState<Error>();
  const load = () => {
    setError(undefined);
    void Promise.all([loadMetadata(), loadListingDetailData()])
      .then(([nextMetadata, nextDataset]) => {
        setMetadata(nextMetadata);
        setDataset(nextDataset);
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
  if (!metadata || !dataset)
    return <StatusView title="正在準備 HomeHunt" message="正在載入最新公開資料…" />;
  return (
    <PersonalStateProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<SearchPage listings={dataset.listings} />} />
            <Route path="/search" element={<SearchPage listings={dataset.listings} />} />
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
