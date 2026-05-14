@echo off
setlocal
title Chronos - install dependencies
cd /d "%~dp0" || ( echo Bad path & pause & exit /b 1 )

if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%LocalAppData%\Programs\node\node.exe" set "PATH=%LocalAppData%\Programs\node;%PATH%"

if not exist "install\install.bat" (
  echo [ERROR] Missing install\install.bat
  pause
  exit /b 1
)

call "%~dp0install\install.bat" pause
set E=%ERRORLEVEL%
echo.
if %E% neq 0 (
  echo Install finished with errors.
) else (
  echo Install finished OK.
)
pause
exit /b %E%
