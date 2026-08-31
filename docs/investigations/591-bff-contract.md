# 591 BFF 合約調查

調查日期：2026-08-25。狀態：`observed`（網路層結果）與 `inferred`（離線 fixture 形狀）分開記錄。

## 調查結果

以每個 endpoint 一次、`GET`、Taipei city id `1`、page `1`、page size `1`，並帶公開的 `Accept: application/json` 與識別用 User-Agent 探測：

| Source   | Endpoint                                         | 結果                                                             |
| -------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| Sale     | `https://bff-house.591.com.tw/v1/web/sale/list`  | `unverified`：本機 socket access denied，未收到 HTTP status/body |
| NewHouse | `https://bff-newhouse.591.com.tw/v1/list-search` | `unverified`：本機 socket access denied，未收到 HTTP status/body |

因此本次沒有 live response 可確認 method 以外的實際 query、Content-Type、status 值、pagination 行為、city/district filtering、headers 必要性、detail enrichment 或 403/429/5xx body。未嘗試重試、繞過、代理、登入或增加請求。

## 離線合約形狀（`inferred`, 未驗證）

- Sale 目標 envelope：`data.house_list` array；fixture 另保留 `data.total` 與 `status`，item 使用最小的 id/title/city/district/price/area/room/floor/address/url。
- NewHouse 目標 envelope：`data.items` array；fixture 另保留 `status`、`data.total`、`data.per_page`，item 使用最小的 id/name/type/city/district/price/area/room/address/url。
- 空結果、缺 envelope、malformed JSON、403、429 與非 JSON error 均有 deterministic fixtures；錯誤 mapping 為 `ACCESS_DENIED`、`RATE_LIMITED`、`NON_JSON`。
- Taipei/New Taipei mapping 維持既有 scope：兩來源均為 `臺北市: 1`、`新北市: 3`；其他城市不屬 production scope。district/section identifier 的實際參數名稱與值仍 unresolved。

Fixtures 位於 `tests/fixtures/591/`，檢查 helper 位於 `crawler/collectors/591-contract/inspection.ts`，只供調查測試使用，未接入正式 591 collector、bootstrap、refresh 或 `production.ts`。

## Unresolved contract

必要/可選 query、district/section 參數、page size 欄位、status 型別、null/空字串/缺欄位行為、HTTP error response、必要 headers、filter 是否生效，以及是否需 detail API，均需在可合法取得 response 的環境由人工重新執行少量 probe 後確認。成功 fixture 目前不可標示為 observed。

## Sale adapter Phase

本 Phase 僅完成可隔離、可測試的 `591-sale` adapter：`request.ts` 建立最小 `GET` request，`parser.ts` 以 `unknown` 接收 JSON boundary，`types.ts` 定義 Sale 專屬 raw type，`normalizer.ts` 提供穩定 `591-sale:<sourceListingId>` identity 與既有 normalized listing mapping。request query（`city_id`、`page`、`page_size`）是 `inferred`／`unverified`，不是已確認的 production contract。

Sale scope 只使用 `crawler/scope/production.ts` 的 `臺北市 -> 1`、`新北市 -> 3` 與城市 boundary；不明或非 scope 城市會 fail closed。錯誤分類涵蓋 `ACCESS_DENIED`、`RATE_LIMITED`、`NON_JSON`、`MALFORMED_JSON`、invalid envelope 與 invalid listing。deterministic fixture tests 覆蓋成功、空結果、缺 data／house_list、非 array、malformed JSON、非 JSON、403、429、scope 與 identity。

目前仍為：confirmed＝endpoint、GET、Accept header、既有 production city mapping；inferred＝Sale envelope、欄位 mapping 與 query names；unverified＝live response、Content-Type、pagination、必要 query／headers 與實際欄位型別。Sale 的 `liveCollectionEnabled` 仍為 `false`，本 Phase 未執行 live collection、bootstrap、candidate promote、refresh 或資料發布；先前 socket access denied 也因此維持停止與 fail-closed。

本 Phase 未實作 `591-newhouse` adapter，亦未修改 production scope、baseline、published data 或 MOI pipeline。
