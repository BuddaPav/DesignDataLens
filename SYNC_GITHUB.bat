@echo off
setlocal
title Chronos — синхронизация с GitHub
cd /d "%~dp0" || exit /b 1
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\github-push.ps1" %*
set ERR=%ERRORLEVEL%
if not "%ERR%"=="0" echo Код выхода: %ERR%
pause
exit /b %ERR%
