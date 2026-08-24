# Phase 02 — Shared Domain

## Goal

建立跨 Browser/Node 的 typed domain、Zod schemas 與共用 utilities。

## Prerequisites

Phase 01。

## In Scope

`shared/domain`、`shared/schemas`、`shared/utils`；Listing、Source、CrawlRun、PriceHistory、ListingEvent、Transaction、enums、money/area/date/hash utilities。

## Out of Scope

React、DOM、SQLite、Crawler implementation、跨來源 Property 去重。

## Testing Requirements

加入 domain、schema、unit conversion、date、hash 與 null semantics tests。

## Acceptance Criteria

Unknown/null semantics、NTD/坪轉換、ISO dates、schema rejection 與 stable hash 有 deterministic unit tests。

## Quality Gate / Definition of Done

typecheck、lint、test、build 實際通過，且 shared 不依賴 React、DOM、SQLite 或 crawler。

## Next Phase

Phase 03 MOI Pipeline 與 Phase 04 Listing Lifecycle 可部分平行。
