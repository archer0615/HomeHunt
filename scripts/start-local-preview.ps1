$ErrorActionPreference = 'Stop'

Write-Host 'Building HomeHunt local preview...'
npm run build
if ($LASTEXITCODE -ne 0) { throw 'HomeHunt build failed; preview was not started.' }

Write-Host 'Starting HomeHunt preview at http://localhost:4173'
npm run preview -- --host 127.0.0.1 --port 4173
