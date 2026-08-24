# 591 NewHouse Source Policy

## Source Overview / Purpose

591-newhouse 是新古屋／新成屋／預售屋房源來源，必須獨立於 `591-sale`。支援 `minTotalPrice`、`maxTotalPrice`、`minUnitPrice`、`maxUnitPrice`、`minBuildingArea`、`maxBuildingArea`，不強迫預售屋提供 exact value。

## Acquisition / Execution

獨立 Collector 負責 Request、Pagination、Source Parsing、Raw Object；Normalizer 再映射 Domain Model。支援 `maxPages`、retry、rate limit、timeout 與 fingerprint 停止規則。

## Normalization / Limitations

預售屋 → `PRESALE`；新成屋／新古屋 → `NEW`；無法判定 → `UNKNOWN`。金額 NTD 元、面積坪，未知維持 null/undefined；區間不可壓成單值。

## Failure / Safety / Scope / Verification

來源獨立；PARTIAL/FAILED 不推進 Missing/Delisted。不得繞過 CAPTCHA、登入、Authentication、Access Control、封鎖或代理池；403 → FAILED + ACCESS_DENIED，必要時改 local 評估。驗證使用 deterministic fixtures，涵蓋區間與分類 mapping；目前未連線抓取 591-newhouse。
