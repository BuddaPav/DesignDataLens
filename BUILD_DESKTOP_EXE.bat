@echo off
setlocal
title Chronos — сборка EXE (Electron)
cd /d "%~dp0" || exit /b 1

if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
if exist "%LocalAppData%\Programs\node\node.exe" set "PATH=%LocalAppData%\Programs\node;%PATH%"

if not exist "app\node_modules" (
  call "%~dp0install\install.bat" pause
  if errorlevel 1 exit /b 1
)

cd /d "%~dp0app" || exit /b 1
echo Building web + packaging Electron...
call npm run desktop:pack
set ERR=%ERRORLEVEL%
if "%ERR%"=="0" (
  echo.
  echo Готово. Запуск: desktop-dist\ChronosChronicles-win32-x64\ChronosChronicles.exe
) else (
  echo Сборка завершилась с кодом %ERR%.
)
echo.
pause
exit /b %ERR%
