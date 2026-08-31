import { Link } from 'react-router-dom';
import type { Listing } from '../../shared/domain';
import { EmptyState } from '../components/StatusView';
import { usePersonalState } from '../personal-state/context';

export function CollectionPage({
  title,
  listings,
  mode,
}: {
  title: string;
  listings: Listing[];
  mode: 'favorite' | 'visited' | 'recent';
}) {
  const { ready, states, error, toggleFavorite, toggleVisited } = usePersonalState();
  if (!ready)
    return (
      <section aria-labelledby="collection-title">
        <h2 id="collection-title">{title}</h2>
        <p role="status">正在載入個人狀態…</p>
      </section>
    );
  if (error)
    return (
      <section aria-labelledby="collection-title">
        <h2 id="collection-title">{title}</h2>
        <p role="alert">個人狀態目前無法載入。</p>
      </section>
    );
  const selected =
    mode === 'recent'
      ? listings.filter((item) => item.status === 'ACTIVE' && item.updatedAt !== item.createdAt)
      : listings.filter((item) => states[item.id]?.[mode]);
  return (
    <section aria-labelledby="collection-title">
      <h2 id="collection-title">{title}</h2>
      {selected.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="listing-results">
          {selected.map((item) => (
            <li key={item.id} className="listing-card">
              <Link to={`/listings/${encodeURIComponent(item.id)}`}>
                {item.title ?? '未命名房源'}
              </Link>
              <p>{[item.city, item.district].filter(Boolean).join(' · ') || '地區未提供'}</p>
              {mode === 'favorite' ? (
                <button type="button" onClick={() => void toggleFavorite(item.id)}>
                  取消收藏
                </button>
              ) : null}
              {mode === 'visited' ? (
                <button type="button" onClick={() => void toggleVisited(item.id)}>
                  取消已看屋
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
