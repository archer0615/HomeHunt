# Phase 04 — Listing Lifecycle

## Goal

先以 synthetic fixtures 完成 Listing、PriceHistory、ListingEvent、RawSnapshot、CrawlRun 與 lifecycle。

## Prerequisites

Phase 02。

## In Scope

DISCOVERED/ACTIVE/MISSING/DELISTED、RESTORED/RELISTED events、price change events、content/raw hashes、5 snapshot limit、SUCCESS reconciliation。

## Out of Scope

真實 591、UI、跨來源 Property 去重、Data Refresh workflow。

## Acceptance / Quality Gate

首次發現、一次 missing、restore、三次 SUCCESS miss delisted、relisted、降價／漲價與 idempotency tests 通過；PARTIAL/FAILED 不增加 missing count；typecheck、lint、test、build 通過。

## Next Phase

與 Phase 03 完成後進入 Phase 05。
