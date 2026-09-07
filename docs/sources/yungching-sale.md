# 永慶房仲網（yungching-sale）來源政策

## 來源與範圍

永慶公開房源搜尋頁作為中古屋候選房源來源，來源 ID 為 `yungching-sale`，與 `591-sale` 分開保存。初期範圍限臺北市與新北市，僅處理公開列表欄位。

## 實作狀態

目前已完成 fixture-based parser、normalizer、pagination contract 與 refresh 接口；`liveCollectionEnabled` 維持 `false`。在確認公開回應 contract、robots／使用條款與請求限制前，不執行 live crawl。

## 正規化

來源 ID 轉為 `yungching-sale:{sourceListingId}`；金額統一為 NTD 元、面積統一為坪。缺漏欄位維持 undefined，不推定為 0 或 false。來源失敗不得推進 Missing／Delisted，也不得覆蓋 known-good dataset。

## 安全與驗證

不得繞過 CAPTCHA、登入、Authentication、Access Control、封鎖或使用代理池。403 必須 fail closed；正式啟用前需補 deterministic fixture、live response contract inspection 與本機 refresh 驗證。
