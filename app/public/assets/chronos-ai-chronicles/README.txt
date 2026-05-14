Chronos — пакет визуальных ассетов (Kimi / Art Bible)
================================================

1) Положите атлас мира (TexturePacker JSON + PNG) в:
   atlas/atlas_world_v01.png
   atlas/atlas_world_v01.json

   Имена кадров: biome_<биом>_var01 … var06, например biome_plains_var01.png
   (в JSON ключи могут быть с суффиксом .png — загрузчик поддерживает оба варианта).

2) Биомы: deep_water, shallow, beach, plains, forest, hills, mountain, snow, desert, ruins.

3) После замены файлов увеличьте version в корневом package.json и пересоберите проект
   (npm run build) — обновится public/version.json и CACHE_NAME в sw.js.

4) Опционально: atlas_npc_v01, atlas_ui_v01 — см. manifest.json (подключение в коде по мере готовности).

5) Сгенерированные в репозитории файлы:
   - atlas/atlas_world_v01.png + .json — из `npm run generate:atlas` (или prebuild).
   - npc/*.png, ui/*.png — рамки и иконки из того же скрипта.
   - chronos_splash_art.png — ключевой кадр (нейросеть + копия в public для интро).
