@echo off
setlocal
title Chronos — десктоп (Electron)
cd /d "%~dp0" || exit /b 1

if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
if exist "%LocalAppData%\Programs\node\node.exe" set "PATH=%LocalAppData%\Programs\node;%PATH%"

if not exist "app\package.json" (
  echo [ERROR] app\package.json not found.
  pause
  exit /b 1
)

if not exist "app\node_modules" (
  echo Installing dependencies...
  call "%~dp0install\install.bat" pause
  if errorlevel 1 exit /b 1
)

cd /d "%~dp0app" || exit /b 1
echo.
echo ============================================
echo   Chronos — полноценное окно Electron
echo   Vite + игра в одном процессе. Ctrl+C — выход.
echo ============================================
echo.
call npm run desktop
set ERR=%ERRORLEVEL%
echo.
pause
exit /b %ERR%
