# Phase 14 — Final Hardening

## Goal

完成跨文件、品質、安全、可及性、效能、PWA、部署與回復驗證，不增加大型功能。

## Prerequisites

Phase 13。

## In Scope

Full tests/E2E、360/768/1280 responsive、accessibility、performance baseline、`npm audit`、PWA verification、Pages verification、Crawler failure simulation、publication anomaly/rollback test、cross-document review。

## Out of Scope

AI、Decision Engine、多人帳號、通知、Backend、Cloud Database。

## Acceptance / Quality Gate

實際執行 `npm ci`、typecheck、lint、test、build、test:e2e、audit（依 scripts 調整）；Application/Data rollback 與 source failure 行為可驗證；無未處理高風險問題。

## Stop Condition

Global Definition of Done 全部滿足，完成報告後停止，不自動建立下一 Phase。

## Next Phase

無；Phase 14 完成後進入維護與由使用者指定的後續需求。
