$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$logDirectory = Join-Path $projectRoot 'data\logs'
$logPath = Join-Path $logDirectory 'refresh.log'

New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
"[$(Get-Date -Format o)] local refresh started" | Add-Content -Path $logPath
Push-Location $projectRoot
try {
  & npm run data:refresh -- --candidate *>> $logPath
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    "[$(Get-Date -Format o)] local refresh failed with exit code $exitCode" | Add-Content -Path $logPath
    exit $exitCode
  }
  "[$(Get-Date -Format o)] local refresh candidate completed; manual review and promote required" | Add-Content -Path $logPath
  exit 0
} catch {
  "[$(Get-Date -Format o)] local refresh error: $($_.Exception.Message)" | Add-Content -Path $logPath
  exit 1
} finally {
  Pop-Location
}
