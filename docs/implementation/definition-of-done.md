# Global Definition of Done

- 需求已完成且沒有超出 Phase scope。
- TypeScript typecheck、lint、適用 tests、build 已實際成功。
- E2E、fixture、integration、accessibility、responsive 或 audit 已依 Phase 執行。
- 新增行為有測試；deterministic tests 不依賴即時外部網站。
- Docs 與程式一致，沒有 Secrets、非必要 dependency、debug code 或假驗證。
- Data publication 通過 schema、integrity、anomaly 與 UserState 檢查。
- Git diff 已檢查，沒有混入無關修改。

若驗證無法執行，必須說明確切原因並標為未驗證，不得宣稱 PASS。Phase commit 可採一個主要 commit 或數個 logical commits；不得 push 或 merge，除非使用者明確要求。
