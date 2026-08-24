import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StatusView } from './components/StatusView';
import { loadMetadata, type PublicationMetadata } from './data/publication';
import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './pages/HomePage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import './App.css';

function Application() {
  const [metadata, setMetadata] = useState<PublicationMetadata>();
  const [error, setError] = useState<Error>();
  const load = () => {
    setError(undefined);
    void loadMetadata()
      .then(setMetadata)
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
  if (!metadata) return <StatusView title="正在準備 HomeHunt" message="正在載入最新公開資料…" />;
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage metadata={metadata} />} />
          <Route path="/favorites" element={<PlaceholderPage title="收藏" />} />
          <Route path="/visited" element={<PlaceholderPage title="已看屋" />} />
          <Route path="/settings" element={<PlaceholderPage title="設定" />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
export function App() {
  return (
    <ErrorBoundary>
      <Application />
    </ErrorBoundary>
  );
}
