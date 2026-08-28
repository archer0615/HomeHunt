# HomeHunt Local-only 使用方式

HomeHunt 目前只供本機使用，不部署至 GitHub Pages，也不依賴 GitHub Actions。

## 啟動本機預覽

在專案根目錄執行：

```powershell
npm run local
```

腳本會先執行 production build；建置成功後才啟動預覽伺服器。請使用 Chrome 開啟 `http://localhost:4173`。

## 本機資料更新

資料更新由 Windows 工作排程器每日 20:20 執行 candidate refresh：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run-local-refresh.ps1
```

建議建立工作時設定：

- 觸發程序：每日 20:20
- 執行程式：`powershell.exe`
- 引數：`-NoProfile -ExecutionPolicy Bypass -File "<專案絕對路徑>\scripts\run-local-refresh.ps1"`
- 工作目錄：專案根目錄
- 不勾選「失敗時重新啟動」以外的自動修復行為

Refresh 只產生 `data/refresh-candidates/<runId>/`，失敗只寫入 `data/logs/refresh.log`，不跳出視窗，也不以空資料覆蓋上一份 known-good dataset。人工確認後才執行：

```powershell
npm run data:refresh:promote -- --run <runId>
```

591 Sale、591 NewHouse 與 MOI 都屬於本機資料流程；591 若遇到 contract、403、rate limit 或格式異常，維持 fail-closed 並保留上一版資料。

## 離線使用

Chrome 會使用最近一次成功載入的資料。離線時可繼續查看已快取資料與本機個人狀態；重新連線後再由使用者確認新版本。

## 不在目前範圍

- GitHub Pages、Production URL、公開部署
- GitHub Actions 自動化
- 雲端資料庫、Backend、登入與跨裝置同步
- 收藏與備註匯出
