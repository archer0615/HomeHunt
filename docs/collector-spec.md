# Collector Specification

## Interfaces

```ts
interface Collector<T> {
  readonly sourceId: string;
  collect(context: CollectorContext): Promise<CollectorResult<T>>;
}
interface RawListing<TPayload = unknown> {
  sourceId: string; sourceListingId?: string; sourceUrl?: string;
  fetchedAt: string; payload: TPayload;
}
```

CollectorResult 必含 `SUCCESS | PARTIAL | FAILED`、items、fetchedPages、fetchedItems、skippedItems、failedItems、warnings、errors。Normalizer 接收 Raw Object，負責 cleaning、mapping、unit conversion、validation。

## Pipeline / Sources

`Request → Pagination → Source Parsing → Raw Object → Normalizer → Validation → SQLite → JSON/NDJSON`。來源獨立為 `591-sale`、`591-newhouse`、`moi`；Collector 不直接寫 Listing DB。591-sale 優先收集來源 ID、標題、地區、價格、坪數、格局、樓層、屋齡、型態、車位、捷運、URL；detail-only 欄位用 Search Crawl + Detail Enrichment，僅新 Listing、內容變更或逾期抓取。591-newhouse 支援 min/max 價格與坪數。MOI 僅官方 Open Data：Download → ZIP → CSV → RawTransaction → Normalizer → Transaction。

## Pagination / Retry / Safety

各 Collector 自理 pagination，支援 configurable `maxPages`；連續頁 fingerprint 相同即停止並 warning。Rate limit、timeout 可配置。408、429、500、502、503、504、network timeout、connection reset 使用 exponential backoff + jitter；400、401、403、404、validation error 不 retry。403 記錄 `ACCESS_DENIED` 並 FAILED，必要時 `executionMode=local`。不得繞過 CAPTCHA、登入、Authentication、Access Control、封鎖或使用代理池。

## Isolation / Hash / Snapshot

單筆錯誤可計入 skipped/failed items；來源採獨立執行／allSettled。所有金額 NTD 元、單價 NTD/坪、面積坪，缺值維持 null/undefined。建物與車位 mapping 集中於 Normalizer。`contentHash` 僅 canonical 業務欄位；`rawDataHash` hash raw payload。新 Listing 或 rawDataHash 改變才保存 RawSnapshot，每 Listing 最近 5 份。

## Acceptance Criteria

- 獨立 Collector、Collector 不直接寫 DB。
- Result 可區分三種狀態並保存統計、warnings、errors。
- maxPages、retry allowlist、backoff、jitter、timeout、rate limit 可配置。
- 來源失敗互不阻塞；403 不 retry 且記 ACCESS_DENIED。
- ID 使用 `{sourceId}:{sourceListingId}`；無穩定 ID 才用 deterministic fingerprint。
- hash 與 lifecycle 規則使增量流程 idempotent。
