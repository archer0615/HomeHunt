export const newHouseSourceConfig = {
  sourceId: '591-newhouse',
  baseUrl: 'https://bff-newhouse.591.com.tw/v1/list-search',
  liveCollectionEnabled: false,
  maxPages: 31,
  requestDelayMs: 1500,
  timeoutMs: 30_000,
  maxRetries: 2,
  concurrency: 1,
} as const;
