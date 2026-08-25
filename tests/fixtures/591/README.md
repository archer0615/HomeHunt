# 591 BFF contract fixtures

取得日期：2026-08-25。目標 endpoint：`https://bff-house.591.com.tw/v1/web/sale/list`、`https://bff-newhouse.591.com.tw/v1/list-search`。

本機以單一 `GET`、Taipei city id `1`、page `1`、最小 page size 探測兩個 endpoint，但兩次連線都在本機網路層被拒絕，沒有收到 HTTP response。因此 `*-success.inferred.json` 與 `*-empty.inferred.json` 是離線合約形狀測試資料，標記為 `inferred`、未經 live response 驗證，不得視為實際成功回應。錯誤 fixtures 是 deterministic 的等價錯誤 body。

欄位名稱仍屬 unresolved contract，沒有將它們接入正式 collector、bootstrap、refresh 或 production scope。
