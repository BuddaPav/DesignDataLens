@echo off
REM =====================
REM Skill Factory Agent - Category 5 (World & Environment)
REM =====================
echo [AGENT] Starting Category 5: World & Environment

REM 41. world-generator
mkdir -p ..\..\.blackbox\skills\world-generator 2>nul
echo --- > ..\..\.blackbox\skills\world-generator\SKILL.md
echo name: world-generator >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo description: Generate game world procedurally. Use when creating new map areas. >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo. >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo # World Generator >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo. >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo ## When to use this skill >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo - Generating map tiles >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo - Procedural generation >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo - Biome placement >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo. >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo ## World Structure >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo. >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo interface World ^(^: >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo   tiles: TileData[] >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo   biomes: Biome[] >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo   size: number >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo ^) >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo. >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo ## Cross-references >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo - [[biome-creator]] - Biomes >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo - [[map-painter]] - Map rendering >> ..\..\.blackbox\skills\world-generator\SKILL.md
echo.
echo [41] world-generator created

REM 42. biome-creator
mkdir -p ..\..\.blackbox\skills\biome-creator 2>nul
echo --- > ..\..\.blackbox\skills\biome-creator\SKILL.md
echo name: biome-creator >> ..\..\.blackbox\skills\biome-creator\SKILL.md
echo description: Create and configure biomes. Use when defining world regions. >> ..\..\.blackbox\skills\biome-creator\SKILL.md
echo. >> ..\..\.blackbox\skills\biome-creator\SKILL.md
echo # Biome Creator >> ..\..\.blackbox\skills\biome-creator\SKILL.md
echo. >> ..\..\.blackbox\skills\biome-creator\SKILL.md
echo ## When to use this skill >> ..\..\.blackbox\skills\biome-creator\SKILL.md
echo - Creating biomes >> ..\..\.blackbox\skills\biome-creator\SKILL.md
echo - Defining terrain types >> ..\..\.blackbox\skills\biome-creator\SKILL.md
echo - Setting vegetation >> ..\..\.blackbox\skills\biome-creator\SKILL.md
echo. >> ..\..\.blackbox\skills\biome-creator\SKILL.md
echo ## Biome Types >> ..\..\.blackbox\skills\biome-creator\SKILL.md
echo - deep_water, shallow, beach >> ..\..\.blackbox\skills\biome-creator\SKILL.md
echo - plains, forest, hills >> ..\..\.blackbox\skills\biome-creator\SKILL.md
echo - mountain, snow, desert >> ..\..\.blackbox\skills\biome-creator\SKILL.md
echo - ruins >> ..\..\.blackbox\skills\biome-creator\SKILL.md
echo.
echo [42] biome-creator created

REM 43. poi-manager
mkdir -p ..\..\.blackbox\skills\poi-manager 2>nul
echo --- > ..\..\.blackbox\skills\poi-manager\SKILL.md
echo name: poi-manager >> ..\..\.blackbox\skills\poi-manager\SKILL.md
echo description: Manage points of interest. Use when marking special locations. >> ..\..\.blackbox\skills\poi-manager\SKILL.md
echo. >> ..\..\.blackbox\skills\poi-manager\SKILL.md
echo # POI Manager >> ..\..\.blackbox\skills\poi-manager\SKILL.md
echo. >> ..\..\.blackbox\skills\poi-manager\SKILL.md
echo ## POI Types >> ..\..\.blackbox\skills\poi-manager\SKILL.md
echo - quest_giver >> ..\..\.blackbox\skills\poi-manager\SKILL.md
echo - shop >> ..\..\.blackbox\skills\poi-manager\SKILL.md
echo - landmark >> ..\..\.blackbox\skills\poi-manager\SKILL.md
echo - dungeon >> ..\..\.blackbox\skills\poi-manager\SKILL.md
echo.
echo [43] poi-manager created

REM 44. weather-system
mkdir -p ..\..\.blackbox\skills\weather-system 2>nul
echo --- > ..\..\.blackbox\skills\weather-system\SKILL.md
echo name: weather-system >> ..\..\.blackbox\skills\weather-system\SKILL.md
echo description: Manage weather and environmental conditions. Use when adding dynamic weather. >> ..\..\.blackbox\skills\weather-system\SKILL.md
echo. >> ..\..\.blackbox\skills\weather-system\SKILL.md
echo # Weather System >> ..\..\.blackbox\skills\weather-system\SKILL.md
echo. >> ..\..\.blackbox\skills\weather-system\SKILL.md
echo ## Weather Types >> ..\..\.blackbox\skills\weather-system\SKILL.md
echo - clear, cloudy, rain >> ..\..\.blackbox\skills\weather-system\SKILL.md
echo - storm, fog, snow >> ..\..\.blackbox\skills\weather-system\SKILL.md
echo.
echo [44] weather-system created

REM 45. day-night-cycle
mkdir -p ..\..\.blackbox\skills\day-night-cycle 2>nul
echo --- > ..\..\.blackbox\skills\day-night-cycle\SKILL.md
echo name: day-night-cycle >> ..\..\.blackbox\skills\day-night-cycle\SKILL.md
echo description: Manage day/night timing and lighting. Use when adding time progression. >> ..\..\.blackbox\skills\day-night-cycle\SKILL.md
echo. >> ..\..\.blackbox\skills\day-night-cycle\SKILL.md
echo # Day-Night Cycle >> ..\..\.blackbox\skills\day-night-cycle\SKILL.md
echo. >> ..\..\.blackbox\skills\day-night-cycle\SKILL.md
echo ## Cycle Phases >> ..\..\.blackbox\skills\day-night-cycle\SKILL.md
echo - dawn, day, dusk, night >> ..\..\.blackbox\skills\day-night-cycle\SKILL.md
echo.
echo [45] day-night-cycle created

REM 46. ambient-manager
mkdir -p ..\..\.blackbox\skills\ambient-manager 2>nul
echo --- > ..\..\.blackbox\skills\ambient-manager\SKILL.md
echo name: ambient-manager >> ..\..\.blackbox\skills\ambient-manager\SKILL.md
echo description: Manage ambient sounds and atmosphere. Use when adding environmental feel. >> ..\..\.blackbox\skills\ambient-manager\SKILL.md
echo. >> ..\..\.blackbox\skills\ambient-manager\SKILL.md
echo # Ambient Manager >> ..\..\.blackbox\skills\ambient-manager\SKILL.md
echo.
echo [46] ambient-manager created

REM 47. map-painter
mkdir -p ..\..\.blackbox\skills\map-painter 2>nul
echo --- > ..\..\.blackbox\skills\map-painter\SKILL.md
echo name: map-painter >> ..\..\.blackbox\skills\map-painter\SKILL.md
echo description: Paint and render game map. Use when displaying world map. >> ..\..\.blackbox\skills\map-painter\SKILL.md
echo. >> ..\..\.blackbox\skills\map-painter\SKILL.md
echo # Map Painter >> ..\..\.blackbox\skills\map-painter\SKILL.md
echo.
echo [47] map-painter created

REM 48. landmark-placer
mkdir -p ..\..\.blackbox\skills\landmark-placer 2>nul
echo --- > ..\..\.blackbox\skills\landmark-placer\SKILL.md
echo name: landmark-placer >> ..\..\.blackbox\skills\landmark-placer\SKILL.md
echo description: Place world landmarks and monuments. Use when adding visual markers. >> ..\..\.blackbox\skills\landmark-placer\SKILL.md
echo. >> ..\..\.blackbox\skills\landmark-placer\SKILL.md
echo # Landmark Placer >> ..\..\.blackbox\skills\landmark-placer\SKILL.md
echo.
echo [48] landmark-placer created

REM 49. mini-map-generator
mkdir -p ..\..\.blackbox\skills\mini-map-generator 2>nul
echo --- > ..\..\.blackbox\skills\mini-map-generator\SKILL.md
echo name: mini-map-generator >> ..\..\.blackbox\skills\mini-map-generator\SKILL.md
echo description: Generate minimap display. Use when creating HUD minimap. >> ..\..\.blackbox\skills\mini-map-generator\SKILL.md
echo. >> ..\..\.blackbox\skills\mini-map-generator\SKILL.md
echo # Minimap Generator >> ..\..\.blackbox\skills\mini-map-generator\SKILL.md
echo.
echo [49] mini-map-generator created

REM 50. exploration-tracker
mkdir -p ..\..\.blackbox\skills\exploration-tracker 2>nul
echo --- > ..\..\.blackbox\skills\exploration-tracker\SKILL.md
echo name: exploration-tracker >> ..\..\.blackbox\skills\exploration-tracker\SKILL.md
echo description: Track world exploration progress. Use when monitoring player progress. >> ..\..\.blackbox\skills\exploration-tracker\SKILL.md
echo. >> ..\..\.blackbox\skills\exploration-tracker\SKILL.md
echo # Exploration Tracker >> ..\..\.blackbox\skills\exploration-tracker\SKILL.md
echo.
echo [50] exploration-tracker created

echo [AGENT] Category 5 complete - 10 skills created!
timeout /t 1 >nul