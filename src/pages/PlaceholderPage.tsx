import { EmptyState } from '../components/StatusView';
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section aria-labelledby="placeholder-title">
      <h2 id="placeholder-title">{title}</h2>
      <EmptyState />
    </section>
  );
}
