# HomeHunt

個人使用的住宅房源聚合、搜尋、篩選、追蹤與決策分析 PWA。

## 目前狀態

**Implementation In Progress / Phase 01 Foundation implemented**：Foundation 骨架已建立；npm 工具鏈驗證受目前本機安裝環境阻塞，尚未進入後續 Phase。

### GitHub Pages 暫停使用

短期內請勿使用或依賴 GitHub Pages 作為 HomeHunt 的展示、部署或資料發布入口。Pages／Actions 維持停用，待部署設定、資料發布流程與 production validation 重新確認後，另行公告恢復。

## Phase 1 Scope

聚合中古屋、新古屋、預售屋公開房源；提供搜尋、篩選、排序、收藏、永久排除、已看屋、價格／上下架歷史與 MOI 實價登錄資料。Phase 1 不包含 LLM、Chatbot、AI Recommendation API、Backend Server 或跨網站去重。

## Architecture Overview

`Data Sources → Collectors → Raw Data → Normalizers → Validation → Domain Model → SQLite → JSON/NDJSON → GitHub Pages → PWA`

## Documentation Index

- [產品需求](docs/product-requirements.md)
- [系統架構](docs/architecture.md)
- [領域模型](docs/domain-model.md)
- [UX 規格](docs/ux-spec.md)
- [Collector 規格](docs/collector-spec.md)
- [Testing Strategy](docs/testing-strategy.md)
- [Coding Standards](docs/coding-standards.md)
- [Source Policies](docs/sources/)
- [Deployment](docs/deployment.md)
- [Implementation Plan](docs/implementation/README.md)
- [Definition of Done](docs/implementation/definition-of-done.md)

## Development Status

尚未開始正式開發；後續實作必須先閱讀 `AGENTS.md` 與 `docs/`。
