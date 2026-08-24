import { ListingLifecycleStore } from '../lifecycle/store';
import { runRefresh } from './orchestrator';

const fixture = process.argv.includes('--fixture');
if (!fixture) {
  throw new Error(
    'Production crawler adapters are not configured. Use --fixture for deterministic orchestration checks.',
  );
}
const at = '2026-08-24T08:20:00+08:00';
const store = new ListingLifecycleStore();
try {
  const result = runRefresh(
    ['moi', '591-sale', '591-newhouse'].map((sourceId) => ({
      sourceId,
      status: 'SUCCESS' as const,
      observations: [],
    })),
    { runId: 'fixture-refresh', startedAt: at, finishedAt: at, store },
  );
  console.log(JSON.stringify({ ...result, mode: 'fixture' }));
} finally {
  store.close();
}
