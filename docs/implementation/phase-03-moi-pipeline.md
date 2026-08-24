# Phase 03 — MOI Pipeline

## Goal

以官方 MOI Open Data 打通第一條 RawTransaction → Normalizer → Transaction → SQLite pipeline。

## Prerequisites

Phase 02；SQLite driver 在本 Phase 開始前選定最小相容方案。

## In Scope

MOI config、download、ZIP/CSV parsing、RawTransaction、normalization、validation、Transaction repository、fixture tests 與獨立 network smoke test。

## Out of Scope

591、PWA、UI、每日排程、Workflow。

## Acceptance / Quality Gate

官方 fixture 可完成 pipeline；m²/NTD per m² 轉換正確；錯誤不寫入有效 Transaction；typecheck、lint、test、build 通過。

## Stop Condition

fixture integration 與 repository 驗證通過即停止；下一個可平行 Phase 為 04。

## Next Phase

Phase 04 — Listing Lifecycle。
