# 591 Sale Source Policy

## Source Overview / Purpose

591-sale 是中古屋主要出售房源來源之一，Collector 必須與 `591-newhouse` 分離，提供 Listing 開價。Phase 1 優先取得 sourceListingId、title、city、district、totalPrice、unitPrice、buildingArea、rooms、halls、bathrooms、floor、totalFloors、buildingAge、buildingType、parking、mrt、sourceUrl。

## Acquisition / Execution

Search Crawl 使用獨立 Collector。mainArea、auxiliaryArea、managementFee、elevator 若只能從 Detail page 取得，使用 Detail Enrichment；只對新 Listing、content changed 或 `detailLastFetchedAt` 超過期限者抓取。

## Normalization / Limitations

來源文字映射 canonical enums，金額 NTD 元、面積坪。缺漏不得推定 0/false；Phase 1 不做跨網站 Property 去重。

## Failure / Safety / Scope / Verification

來源獨立；PARTIAL/FAILED 不推進 Missing/Delisted。不得繞過 CAPTCHA、登入、Authentication、Access Control、封鎖或代理池；403 → FAILED + ACCESS_DENIED，必要時改 local 評估。驗證使用 deterministic fixtures 與 parser/normalizer tests；目前未連線抓取 591。
