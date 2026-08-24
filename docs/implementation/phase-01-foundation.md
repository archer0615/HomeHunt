# Phase 01 — Foundation

## Goal

建立可 build、test、lint、type-safe 的 Node.js 22/npm、TypeScript、Vite、React 專案骨架。

## Prerequisites

無。 

## In Scope

`package.json`、tsconfig、ESLint、Prettier、Vitest、基本 `src/`、`crawler/`、`shared/`、`tests/`、`public/`、`.github/` 結構與 scripts：dev、build、typecheck、lint、test。

## Out of Scope

房屋功能、Collector、Listing UI、Database、PWA 行為、Workflow。

## Testing Requirements

執行 `npm ci`、`npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`。

## Acceptance Criteria

全部命令實際成功；依賴方向與 `shared` pure TypeScript 規則可檢查。

## Quality Gate / Definition of Done

Buildable、Testable、Lintable、Type-safe skeleton 完成，且沒有房屋功能。

## Next Phase

Phase 02 — Shared Domain。
