# Phase 16 — Local Decision and Duplicate Review

## Goal

使用現有搜尋條件在瀏覽器端提供可解釋的符合度排序，並提示可能來自不同來源的同一物件供使用者人工查看。

## Prerequisites

Phase 15 本機功能已完成。此為使用者明確要求的 Local-only 子集。

## In Scope

- `BEST_MATCH` 依目前已啟用的搜尋維度計分；每個維度等權，結果顯示百分比與符合維度摘要。
- 沒有啟用的搜尋條件時不顯示符合度分數。
- 跨來源候選僅以城市、行政區、正規化完整地址、權狀坪數（±3%）、房數及可用樓層進行 deterministic matching。
- 疑似重複僅顯示在搜尋卡片供人工比較；不能合併、隱藏或修改 Listing / propertyId。
- 保持 pure TypeScript matching logic，不新增 dependency、不使用外部 API。

## Out of Scope

AI/LLM、投資或估價建議、人工設定權重、property identity registry、automatic merge、Backend、登入、雲端資料庫及跨裝置同步。

## Acceptance / Quality Gate

- 每個已啟用條件對符合度有可測試解釋；無條件時不產生誤導分數。
- 重複提示需同來源排除、缺地址排除；地址、房間或樓層衝突時不配對，坪數超過容差時不配對。
- 提示提供另一筆房源的連結，不影響搜尋結果或個人狀態。
- deterministic tests、typecheck、lint、test、build 通過。

## Stop Condition

本機決策排序與人工重複審查完成後回報並停止。完整 Decision Engine、AI 或雲端同步不包含在本 Phase。
