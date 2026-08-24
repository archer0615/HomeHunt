# Phase 06 — 591 NewHouse

## Goal

建立與 591-sale 分離的新成屋／預售屋 Collector。

## Prerequisites

Phase 05。

## In Scope

PRESALE/NEW/UNKNOWN mapping、min/max price/unit price/building area、raw/parser/normalizer/validation 與 source isolation。

## Out of Scope

把 range 壓成 exact value、合併 sale adapter、UI、跨來源去重。

## Acceptance / Quality Gate

區間資料保留、分類 mapping 正確、PARTIAL/FAILED 不 reconciliation；fixtures、typecheck、lint、test、build 通過。

## Next Phase

Phase 07 — Data Publication。
