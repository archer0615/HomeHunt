# Testing Strategy

## Testing Pyramid

```text
E2E：少量
Integration：適量
Unit：大量
```

P0 核心為 Normalizer、Listing Lifecycle、PriceHistory、Filter Engine、Collector Pipeline。Unit 使用 deterministic fixtures，不直接依賴 591、MOI 或其他即時網站；network smoke test 與 CI unit test 分離。

## Unit Tests

Normalizer 驗證 `2580萬 → 25800000`、`92 m² → 27.83坪`、未知車位保持 undefined、`3房2廳2衛 → 3/2/2`，並確認缺值不變成 0/false。Lifecycle 覆蓋 discovered、missing、restored、三次 SUCCESS miss 後 delisted、relisted，以及 PARTIAL/FAILED 不增加 missing count。PriceHistory 覆蓋首次新增、相同不新增、降價／漲價事件及 idempotency。

Filter Engine 覆蓋地區、價格、坪數、房數、屋齡、樓層、電梯、車位、管理費、建物型態與 Hard Exclude。未啟用 Filter 時 Unknown 保留；啟用 Filter 時 Unknown 視為無法證明符合而不通過。

## Integration / E2E / Quality Gates

Integration pipeline：Raw → Parser/Normalizer → Validation → Repository → PriceHistory → ListingEvent；優先打通官方 MOI Transaction Pipeline。Playwright 覆蓋 Search + Favorite、Permanent Exclude + Undo、Listing Detail + Price History + Original Source Link。

實作 Phase 原則上執行 `npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`；涉及 E2E 時再執行 `npm run test:e2e`。初始 coverage target：overall >=70%，Normalizer/Lifecycle/Filter Engine/PriceHistory >=90%；coverage 只是輔助指標，不取代行為驗證。只有實際執行成功才可宣稱 PASS。

## CI / Security

Application CI 於 push/pull_request 執行 typecheck、lint、test、build；Data Refresh 於 schedule/workflow_dispatch 執行 Collectors、Normalization、Data Export，兩者分離。Release 前考慮 `npm audit`，不得提交 API Key、Cookie、Token、Password、Secret；`.env` 應列入 `.gitignore`。
