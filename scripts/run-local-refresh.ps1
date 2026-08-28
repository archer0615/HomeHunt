$ErrorActionPreference = 'Continue'
$projectRoot = Split-Path -Parent $PSScriptRoot
$logDirectory = Join-Path $projectRoot 'data\logs'
$logPath = Join-Path $logDirectory 'refresh.log'

New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
"[$(Get-Date -Format o)] local refresh started" | Add-Content -Path $logPath
Push-Location $projectRoot
try {
  npm run data:refresh -- --candidate *>> $logPath
  $exitCode = $LASTEXITCODE
  "[$(Get-Date -Format o)] local refresh finished with exit code $exitCode" | Add-Content -Path $logPath
  exit $exitCode
} catch {
  "[$(Get-Date -Format o)] local refresh error: $($_.Exception.Message)" | Add-Content -Path $logPath
  exit 1
} finally {
  Pop-Location
}
