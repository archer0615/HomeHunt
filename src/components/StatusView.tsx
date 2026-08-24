interface StatusViewProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}
export function StatusView({ title, message, actionLabel, onAction }: StatusViewProps) {
  return (
    <section className="status-view" role="status">
      <h2>{title}</h2>
      <p>{message}</p>
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
export function EmptyState() {
  return <StatusView title="目前沒有資料" message="公開房源資料準備完成後會顯示在這裡。" />;
}
