# Установка зависимостей после обновления проекта (аналог install\install.bat).
# Запуск: из корня репозитория  .\install\install.ps1
# Или с паузой в конце:  .\install\install.ps1 -Pause

param(
    [switch] $Pause
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host ""
Write-Host "============================================"
Write-Host "  install — AFK Game / Chronos"
Write-Host "  Корень: $Root"
Write-Host "============================================"
Write-Host ""

if (Test-Path (Join-Path $Root '.git')) {
    $git = Get-Command git -ErrorAction SilentlyContinue
    if ($git) {
        Write-Host "[1/2] git pull ..."
        try {
            git -C $Root pull
        } catch {
            Write-Warning "git pull: $_"
        }
    } else {
        Write-Host "[install] git не в PATH — пропуск pull."
    }
} else {
    Write-Host "[install] Нет .git — пропуск pull."
}

$pkg = Join-Path $Root 'app\package.json'
if (-not (Test-Path $pkg)) {
    Write-Error "Нет app\package.json"
}

Write-Host ""
Write-Host "[2/2] npm install в app\"
Set-Location (Join-Path $Root 'app')
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "============================================"
Write-Host "  Готово. Запуск: cd app; npm run dev"
Write-Host "============================================"
Write-Host ""

if ($Pause) {
    Read-Host "Enter для выхода"
}
