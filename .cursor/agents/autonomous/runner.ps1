# Autonomous System Runner
# Usage: Run in project directory

$ErrorActionPreference = "Stop"

Write-Host "[Runner] Checking Ollama..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method GET -TimeoutSec 5
    $models = $response.models.Count
    Write-Host "[Runner] Ollama: $models models available" -ForegroundColor Green
} catch {
    Write-Host "[Runner] Ollama NOT available" -ForegroundColor Red
    exit 1
}

Write-Host "[Runner] Checking project..." -ForegroundColor Cyan

if (Test-Path ".cursor/agents/core/human-evaluation.ts") {
    Write-Host "[Runner] Human Evaluation: OK" -ForegroundColor Green
} else {
    Write-Host "[Runner] Human Evaluation: MISSING" -ForegroundColor Red
}

if (Test-Path ".cursor/agents/autonomous/orchestrator.ts") {
    Write-Host "[Runner] Orchestrator: OK" -ForegroundColor Green
} else {
    Write-Host "[Runner] Orchestrator: MISSING" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== AUTONOMOUS SYSTEM READY ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "To start the system, add this to browser console:" -ForegroundColor White
Write-Host ""
Write-Host "  const script = document.createElement('script');" -ForegroundColor Gray
Write-Host "  script.src = '.cursor/agents/autonomous/system-runner.ts';" -ForegroundColor Gray
Write-Host "  document.head.appendChild(script);" -ForegroundColor Gray
Write-Host ""
Write-Host "Or use:" -ForegroundColor White
Write-Host "  window.afkStart()" -ForegroundColor Cyan
Write-Host "  window.afkStatus()" -ForegroundColor Cyan
Write-Host "  window.afkStop()" -ForegroundColor Cyan
Write-Host ""