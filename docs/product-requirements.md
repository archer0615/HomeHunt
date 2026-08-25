# Product Requirements

## 產品定位與使用情境

HomeHunt 是個人住宅房源聚合、搜尋、篩選、追蹤與決策分析 PWA。使用者搜尋中古屋、新古屋、預售屋，依地區、捷運、價格、坪數、格局與建物條件篩選，並追蹤收藏、已看屋、永久排除與價格／上下架歷史。

## Phases

- **Phase 1**：統一搜尋、篩選、排序、詳情、歷史、個人狀態、離線使用與 MOI 實價登錄；來源為 `591-sale`、`591-newhouse`、`moi`。
- **Phase 2 — Decision Engine**：Status: Deferred。Phase 1 完成與穩定性驗證優先，未排入近期 implementation roadmap。
- **Phase 3 — AI Advisor**：Status: Deferred。Phase 1 完成與穩定性驗證優先，未排入近期 implementation roadmap。
- Phase 1 不加入 LLM、Chatbot 或 AI Recommendation API。

## 功能需求

房屋類型為 USED、NEW、PRESALE、UNKNOWN；條件包含縣市、行政區、捷運線／多選站、總價／單價、室內／權狀坪數、至少 N 房、屋齡、樓層、電梯、車位／類型、管理費、建物型態。可保存 `mrtDistanceMeters`，但 Phase 1 不以距離篩選。

預設 Hard Exclude：1 樓、工業住宅、來源明確標示的凶宅／事故屋；不做額外安全分析。Hard Exclude Keywords 可由使用者增減；Soft Warning 只提示不排除。收藏、永久排除、已看屋存 IndexedDB，不寫公開 listings JSON。

房源每日兩次增量 Crawl、每週 Full Reconciliation；MOI 依官方 Open Data 更新。前端 React/Vite/TypeScript/PWA/IndexedDB，GitHub Pages Hosting，離線可搜尋已下載資料，搜尋條件存 URL。

## Out of Scope

Backend/VPS/Cloud SQL、正式跨裝置同步、SQLite 作 Pages 直接資料源、跨網站去重（僅預留 nullable `propertyId`）、Crawler 繞過 CAPTCHA／驗證／封鎖，以及未要求的 AI 功能。
