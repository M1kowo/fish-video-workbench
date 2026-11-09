$ErrorActionPreference = 'Stop'
$fishAddress = 'http://127.0.0.1:4318'
$fishHealthy = $false
try { $fishHealthy = (Invoke-RestMethod "$fishAddress/api/health" -TimeoutSec 2).ok } catch {}
if (-not $fishHealthy) {
  $fishLogDirectory = Join-Path $PSScriptRoot 'data'
  New-Item -ItemType Directory -Path $fishLogDirectory -Force | Out-Null
  Start-Process -FilePath 'node' -ArgumentList 'server.mjs' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $fishLogDirectory 'server.log') -RedirectStandardError (Join-Path $fishLogDirectory 'server-error.log')
  for ($fishAttempt = 0; $fishAttempt -lt 30; $fishAttempt++) {
    Start-Sleep -Milliseconds 500
    try { if ((Invoke-RestMethod "$fishAddress/api/health" -TimeoutSec 1).ok) { $fishHealthy = $true; break } } catch {}
  }
}
if (-not $fishHealthy) { throw '启动未完成，请查看 data/server-error.log，或在工作台目录运行 npm run dev。' }
Start-Process $fishAddress
