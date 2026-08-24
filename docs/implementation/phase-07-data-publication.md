# Phase 07 — Data Publication

## Goal

將 SQLite working state 產生可驗證、可回復的 canonical JSON/NDJSON。

## Prerequisites

Phase 03、04、06。

## In Scope

metadata、listings、history、transactions export；schemaVersion/appDataVersion/generatedAt；staging、全量 validation、atomic publish、known-good 保留、anomaly guard、source failure 保留舊資料。

## Out of Scope

GitHub Actions、PWA cache、UserState 發布。

## Acceptance / Quality Gate

JSON/NDJSON、schema、metadata、unique IDs、non-negative prices、finite numbers、source references 與 no UserState 驗證通過；異常數量可阻擋發布；無變更不產生空 commit。

## Next Phase

Phase 08 — PWA Foundation。
