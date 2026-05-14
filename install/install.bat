@echo off
setlocal EnableDelayedExpansion

rem Installs npm dependencies in app\. Optional git pull from repo root.

pushd "%~dp0.." || exit /b 1
set "ROOT=%CD%"
popd

cd /d "%ROOT%" || exit /b 1

echo.
echo ============================================
echo   install - AFK Game / Chronos
echo   Root: %ROOT%
echo ============================================
echo.

if exist "%ROOT%\.git" (
  where git >nul 2>&1
  if !ERRORLEVEL! equ 0 (
    echo [1/2] git pull ...
    pushd "%ROOT%"
    git pull
    if errorlevel 1 echo [install] Warning: git pull failed.
    popd
  ) else (
    echo [install] git not in PATH, skip pull.
  )
) else (
  echo [install] No .git, skip pull.
)

if not exist "%ROOT%\app\package.json" (
  echo [install] ERROR: missing app\package.json
  exit /b 1
)

echo.
echo [2/2] npm install in app\
pushd "%ROOT%\app" || exit /b 1
call npm install
if errorlevel 1 (
  echo [install] ERROR: npm install failed
  popd
  exit /b 1
)
popd

echo.
echo ============================================
echo   Done. Run:  cd app
echo            then:  npm run dev
echo ============================================
echo.

if /i "%~1"=="pause" pause
exit /b 0
