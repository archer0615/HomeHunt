# Phase 05 — 591 Sale

## Goal

建立獨立 591-sale Search Collector 與 Normalizer。

## Prerequisites

Phase 03、04。

## In Scope

指定 sale 欄位、raw model、parser、mapping、validation、pagination、retry、rate limit、timeout、error isolation；之後依條件加入 Detail Enrichment。

## Out of Scope

591-newhouse、跨網站去重、全量 Detail 每輪重抓、UI。

## Acceptance / Quality Gate

fixture 能產出 canonical Listing；Detail 只對新 Listing、content changed 或逾期項目；403 不 retry 且為 FAILED/ACCESS_DENIED；typecheck、lint、test、build 與 fixtures 通過。

## Next Phase

Phase 06 — 591 NewHouse。
