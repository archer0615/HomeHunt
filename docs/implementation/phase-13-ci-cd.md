# Phase 13 — CI/CD

## Goal

建立分離且最小權限的 Application CI、Data Refresh、Pages deployment workflows。

## Prerequisites

Phase 12。

## In Scope

`ci.yml`、`data-refresh.yml`、`pages.yml`、UTC schedule、reconciliation、source isolation、concurrency、timeout、permissions、data-change commit、base path。

## Out of Scope

Backend、Cloud deployment、Email/Slack/Discord notification。

## Acceptance / Quality Gate

CI 執行 typecheck/lint/test/build；Data Refresh 可 manual/schedule 且不覆蓋 known-good；一般 CI read、資料 commit 才 write；無變更不空 commit；workflow validation 與 dry-run checks 通過。

## Next Phase

Phase 14 — Final Hardening。
