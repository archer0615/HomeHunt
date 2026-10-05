# Phase 15 — Market Reference and Comparison

## Goal

讓使用者可用已發布的 MOI 成交資料作行政區參考，並比較最多四筆房源；強化 candidate promote 的失敗回復。此 Phase 不假設任何外部來源授權或未驗證 API 契約。

## Prerequisites

使用者明確指定的後續工作。Phase 14 全域品質閘門仍須另外完成。

## In Scope

- 前端載入並驗證 `transactions/all.json`，納入離線完整資料快取。
- 詳情頁顯示同縣市／行政區、同交易類型、近五年、建物面積相近（±20%）的成交參考；資料不足時清楚顯示無參考資料。
- 以 URL 保存比較清單，最多四筆；可由搜尋及詳情加入，並提供比較表。
- candidate promote 任一步驟失敗時恢復已存在的 canonical DB 與公開資料。
- MOI 下載以 candidate-only 驗證，不可繞過官方申請／授權條件；591 live 只有在取得並驗證合法回應契約後才可啟用。

## Out of Scope

跨網站物件去重、估價／投資建議、地理編碼、未授權來源抓取、AI、Backend、帳號或雲端同步。

## Acceptance / Quality Gate

測試成交參考篩選、交易缺欄位、比較上限與 URL 恢復、各 promote 中途失敗回復；typecheck、lint、test、build 通過。Live source 僅在授權及合約可驗證時執行。

## Stop Condition

完成此 Phase 的本機功能與回復閘門後回報並停止。外部授權／合約未具備時，報告為明確外部阻塞，保留 fail-closed。
