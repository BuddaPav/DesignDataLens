#Requires -Version 5.1
<#
  Коммит всех изменений в корне репозитория и push в origin (ветка по умолчанию).
  Использование:
    .\scripts\github-push.ps1
    .\scripts\github-push.ps1 -Message "feat: описание"
  Один раз настройте remote:
    git remote add origin https://github.com/<user>/<repo>.git
    git push -u origin main
#>
param(
  [string] $Message = ""
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$null = git rev-parse --is-inside-work-tree 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Не git-репозиторий: $RepoRoot"
  exit 1
}

$remotes = git remote
if ($remotes -notcontains "origin") {
  Write-Host @"
Remote origin не настроен.

1. Создайте пустой репозиторий на https://github.com/new (без README, если уже есть локальный коммит).
2. Выполните в этой папке:
   git remote add origin https://github.com/<ваш-логин>/<имя-репо>.git
   git push -u origin main
"@
  exit 1
}

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ([string]::IsNullOrWhiteSpace($branch)) {
  Write-Error "Не удалось определить текущую ветку."
  exit 1
}

git add -A
$dirty = git status --porcelain
if ([string]::IsNullOrWhiteSpace($dirty)) {
  Write-Host "Нет изменений для коммита."
} else {
  if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = "chore: sync $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
  }
  git commit -m $Message
  if ($LASTEXITCODE -ne 0) {
    Write-Error "git commit завершился с ошибкой."
    exit 1
  }
}

git push -u origin $branch
if ($LASTEXITCODE -ne 0) {
  Write-Error "git push не удался. Проверьте вход (HTTPS: Personal Access Token, SSH: ключ)."
  exit 1
}

Write-Host "Готово: origin/$branch обновлён."
