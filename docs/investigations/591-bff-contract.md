# 591 BFF 合約調查

調查日期：2026-08-25。狀態：`observed`（網路層結果）與 `inferred`（離線 fixture 形狀）分開記錄。

## 調查結果

以每個 endpoint 一次、`GET`、Taipei city id `1`、page `1`、page size `1`，並帶公開的 `Accept: application/json` 與識別用 User-Agent 探測：

| Source | Endpoint | 結果 |
| --- | --- | --- |
| Sale | `https://bff-house.591.com.tw/v1/web/sale/list` | `unverified`：本機 socket access denied，未收到 HTTP status/body |
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
