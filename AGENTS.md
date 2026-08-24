# HomeHunt Agent Instructions

- 以繁體中文回覆。
- 修改前先閱讀 `docs/`，並以其作為唯一專案規格基準。
- 優先順序：使用者最新指令 > 本文件 > `docs/` > 現有程式。
- 衝突時以較新且更具體的規格為準；不得自行增加大型功能或提前實作未要求 Phase。
- 修改前檢查現有程式與文件，只做最小必要修改；修改後執行適當驗證。
- 不得聲稱未實際執行的命令成功。
- 修改前閱讀相關 docs；shared/ 必須保持跨 runtime pure TypeScript。
- 不得自行增加未規劃大型 dependency，也不得把即時外部網站依賴放入 deterministic unit test。
- 部署相關修改必須先閱讀 `docs/deployment.md`。
- 不得將 Secrets 或 private data 寫入 public data；Data Refresh 失敗不得以空資料覆蓋 known-good dataset。
- 正式 Coding 前先閱讀對應 Phase 文件；一次只執行一個 Phase，不得提前實作下一 Phase。
- 完成 Phase 後執行適用 Quality Gate、回報並停止，等待使用者下一個指令。
- 除非明確要求，不得 commit、push 或 merge。

Phase 1 不加入 LLM、Chatbot、AI Recommendation API、Backend Server、跨來源 Property 去重或安全風險評分。
