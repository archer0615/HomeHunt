# MOI Source Policy

## Source Overview

內政部實價登錄 Open Data 是成交市場資料，不是出售房源；包含中古成交與預售成交，供 `Transaction` 使用並與 Listing 開價分離。

## Acquisition / Execution

官方 Open Data Download → ZIP → CSV → RawTransaction → Normalizer → Transaction。官方批次資料目前以 ZIP/CSV 發布，壓縮包可能包含 `MANIFEST.CSV`、`schema-main.csv`、`schema-build.csv`、`schema-land.csv`、`schema-park.csv` 與交易資料 CSV；Parser 必須 discovery relevant CSV，不假設固定 entry。不得以 Browser Automation 爬 UI 作主要來源。可每日檢查 upstream，無變化即 Skip，不需每日兩次更新。

## Normalization / Limitations

`m² → 坪`、`NTD/m² → NTD/坪`；未知欄位保持 null/undefined。官方格式、欄位變更或資料延遲可能造成 Parse/Validation 失敗。

## Failure / Safety / Scope

使用 SUCCESS/PARTIAL/FAILED 與 ACCESS_DENIED；來源獨立，失敗不影響其他來源。不得繞過 CAPTCHA、登入、Authentication、Access Control、封鎖或代理池；403 → FAILED + ACCESS_DENIED，必要時改 local 由人工評估。Phase 1 支援 USED/PRESALE Transaction。驗證以官方 fixture 與 pipeline integration 為主；目前未執行 live verification。
