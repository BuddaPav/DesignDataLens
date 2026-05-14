@echo off
setlocal EnableDelayedExpansion
title Chronos - AFK Game

REM --- UTF-8 without chcp (chcp 65001 can break .bat parsing on some PCs) ---
cd /d "%~dp0" || (
  echo Failed to cd to script folder.
  pause
  exit /b 1
)

REM Node from standard installer is often missing in PATH when Explorer starts cmd
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
if exist "%LocalAppData%\Programs\node\node.exe" set "PATH=%LocalAppData%\Programs\node;%PATH%"

if not exist "app\package.json" (
  echo [ERROR] app\package.json not found.
  echo Put this file in the game folder ^(next to the app folder^).
  echo.
  pause
  exit /b 1
)

if not exist "app\node_modules" (
  echo First run: installing dependencies ^(may take a minute^)...
  echo.
  call "%~dp0install\install.bat" pause
  if errorlevel 1 (
    echo.
    echo Install failed. See messages above.
    pause
    exit /b 1
  )
)

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not in PATH.
  echo Install Node from https://nodejs.org ^(LTS^), then run this file again.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm not found ^(usually comes with Node.js^).
  echo.
  pause
  exit /b 1
)

cd /d "%~dp0app" || (
  echo [ERROR] Cannot open app folder.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   Chronos - starting dev server
echo   Browser will open. Keep THIS window open.
echo   To stop: press Ctrl+C, then any key.
echo ============================================
echo.

call npm run play
set "ERR=%ERRORLEVEL%"

echo.
if not "%ERR%"=="0" (
  echo Server exited with code %ERR%.
  echo Read the messages above ^(port busy, missing modules, etc.^).
) else (
  echo Server stopped.
)
echo.
pause
exit /b %ERR%
