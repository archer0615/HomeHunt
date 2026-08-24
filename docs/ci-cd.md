# CI/CD 操作說明

## Workflow 分工

- `ci.yml` 在 push 與 pull request 執行 Node 22、`npm ci`、typecheck、lint、test、format check 與 build。
- `data-refresh.yml` 以 UTC `00:20`／`12:20`（台灣時間 08:20／20:20）排程，也支援手動執行；同一時間只允許一個 canonical data refresh。
- `pages.yml` 在 `main` 程式變更後或手動執行，建置並驗證 `dist/`，再部署 GitHub Pages。

## 目前限制

Data Refresh workflow 會先用正式 `data:hydrate` CLI 將已發布的 known-good dataset 還原到 runner-local SQLite，再呼叫既有的 `data:publish` CLI。若 `public/data/metadata.json` 不存在，workflow 會安全失敗，不會用空資料覆蓋 known-good dataset。新增資料來源的 crawler orchestration 仍必須由正式 TypeScript command 提供，不能在 YAML 中重寫 domain logic。

本機既有流程仍可使用：

```bash
npm run data:publish -- --db <canonical.sqlite>
npm run data:hydrate -- --input public/data --db data/canonical.sqlite
```

GitHub Pages 的 base path 仍由 Vite 設定管理；workflow 不修改產出的 URL、manifest 或 Service Worker。
