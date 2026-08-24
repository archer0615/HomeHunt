# Coding Standards

## 技術基準

Node.js 22 LTS、TypeScript、React、Vite、`vite-plugin-pwa`、React Router（GitHub Pages 優先 HashRouter）、Zod、IndexedDB/Dexie、SQLite、Vitest、React Testing Library、Playwright、ESLint、Prettier、npm。

Phase 1 不預設引入 Next.js、Redux、Zustand、ORM、Docker、Backend Framework、GraphQL、Cloud Database；UI library 待 UI 實作時決定。

## Repository Architecture

```text
src/       Browser / PWA application
crawler/   Node.js crawler runtime
shared/    Browser + Node 共用 pure TypeScript
tests/     tests and fixtures
public/data/ published JSON/NDJSON
.github/workflows/ future workflows
```

依賴方向：`src → shared`、`crawler → shared`。禁止反向依賴及 `src → crawler`。`shared/` 不得 import React、使用 DOM、Node-only API、直接操作 SQLite 或依賴 crawler implementation。

## TypeScript / Units / Time

`strict=true`、`noUncheckedIndexedAccess=true`。資料流遵循 `unknown → validation → typed domain object`；避免 `any`、`as any` 與不必要 assertion。Domain enum 使用 union type 或 enum-like constant。金額為 NTD 元 integer；面積為坪、最多 2 位小數；Persistence 使用 ISO 8601，產品時區為 Asia/Taipei。未知值保持 null/undefined，Boolean 必須區分 true、false、unknown。

## Logging / Dependencies

Pipeline 使用 logger abstraction：`debug`、`info`、`warn`、`error`；context 至少含 `runId`、`sourceId`、`stage`，錯誤另含 `errorCode`。錯誤分類包含 NETWORK_ERROR、TIMEOUT、RATE_LIMITED、ACCESS_DENIED、PARSE_ERROR、VALIDATION_ERROR、PAGINATION_ERROR、SOURCE_CHANGED、DATABASE_ERROR、UNKNOWN。新增 dependency 前先確認標準能力與既有 dependency；HTTP 優先原生 `fetch`。

## Frontend / Git Quality

採 Semantic HTML、Keyboard Navigation、Form Labels、Visible Focus、必要時 ARIA。Mobile First，至少驗證 360px、768px、1280px，處理 Loading、Success、Empty、Error、Offline。穩定基準為 `main`，可使用 `feat/*`、`fix/*`、`docs/*`；推薦 Conventional Commits：`feat:`、`fix:`、`docs:`、`refactor:`、`test:`、`chore:`。
