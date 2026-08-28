# CI/CD 操作說明

## Workflow 分工

- `ci.yml` 在 push 與 pull request 執行 Node 22、`npm ci`、typecheck、lint、test、format check 與 build。
- `data-refresh.yml` 以 UTC `00:20`／`12:20`（台灣時間 08:20／20:20）排程，也支援手動執行；同一時間只允許一個 canonical data refresh。
- `pages.yml` 在 `main` 程式變更後或手動執行，建置並驗證 `dist/`，再部署 GitHub Pages。

## 目前限制

目前產品採 Local-only 模式：GitHub Actions、GitHub Pages 與 Production deployment 均停用。資料 refresh 改由 Windows Task Scheduler 每日 20:20 執行 `scripts/run-local-refresh.ps1`；失敗只寫入 `data/logs/refresh.log`，不跳出視窗，也不覆蓋 known-good dataset。

GitHub Pages deployment、Production URL validation 與 PWA production validation 目前暫停，不得將 Pages workflow 或 404 的 Production URL 作為 HomeHunt 正式部署依據。Production App 尚未正式上線；近期驗證以 Local Build、Local Preview、Offline Browser、Fixture Data 與 Repository CI 為準。Data Refresh 不依賴 GitHub Pages，且仍須驗證 MOI refresh、591 adapters 的 paused／安全狀態、Candidate／Publication artifact、known-good baseline protection 與失敗時不覆蓋既有資料。

Data Refresh workflow 會先用正式 `data:hydrate` CLI 將已發布的 known-good dataset 還原到 runner-local SQLite，再呼叫既有的 `data:publish` CLI。若 `public/data/metadata.json` 不存在，workflow 會安全失敗，不會用空資料覆蓋 known-good dataset。新增資料來源的 crawler orchestration 仍必須由正式 TypeScript command 提供，不能在 YAML 中重寫 domain logic。

首次資料初始化使用一次性的人工流程，不由排程自動執行：

```bash
npm run data:bootstrap -- --fixture
npm run data:bootstrap:promote -- --candidate <bootstrapId>
```

Bootstrap 先產生隔離的 candidate，要求 MOI、591-sale、591-newhouse 全部 SUCCESS，並通過 publication validation；只有人工確認後才可 promote。Promote 會建立 canonical SQLite、published data 與 active baseline marker。若 active baseline 已存在，bootstrap 與 promote 都會拒絕覆蓋。未有 active baseline 或 publication metadata 時，正常 `data:refresh` 維持安全失敗。

本機既有流程仍可使用：

```bash
npm run data:publish -- --db <canonical.sqlite>
npm run data:hydrate -- --input public/data --db data/canonical.sqlite
```

GitHub Pages 的 base path 仍由 Vite 設定管理；workflow 不修改產出的 URL、manifest 或 Service Worker。
