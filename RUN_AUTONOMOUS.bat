@echo off
REM Autonomous Second Brain Runner
cd /d "%~dp0"
echo [Chronos] Starting autonomous second brain...
call npx ts-node ai_support/secondbrain/autonomous.ts
