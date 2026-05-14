# Внешние источники графики для Chronos (кураторский список)

Цель: быстро находить **легальные** наборы под 2D/UI/3D и не дублировать покупки лицензий. Перед импортом в `public/assets/chronos-ai-chronicles/` проверьте лицензию конкретного файла и занесите замену в `CHRONOS_GRAPHICS_REGISTRY` (`swap`).

## 2D — спрайты, тайлы, иконки растровые

| Источник | Лицензии / нюансы | Заметки для Chronos |
|----------|-------------------|---------------------|
| [Kenney.nl](https://kenney.nl/assets) | Часто **CC0** (свободно, без обязательной атрибуции) | Универсальные UI/тайлы/пиксель; идеальный слой для прототипа и «геймдев-лего». |
| [itch.io](https://itch.io/game-assets/free) | Зависит от страницы набора | Фильтры по стилю; читать лицензию на каждой странице. |
| [CraftPix.net — freebies](https://craftpix.net/freebies/) | У каждого набора своя | Часто пиксель и UI; подходит под замену заглушек атласов. |
| [OpenGameArt.org](https://opengameart.org/) | Разные (CC-BY, CC0, GPL…) | Классический архив; **обязательно** сверять лицензию файла и условия атрибуции. |

## 3D — модели и PBR

| Источник | Лицензии / нюансы | Заметки |
|----------|-------------------|---------|
| [Quaternius](https://quaternius.com/) | Указано на странице набора | Low-poly стилизация; хорошо стыкуется с процедурным миром. |
| [Poly Haven](https://polyhaven.com/) | Преимущественно **CC0** | HDRi, текстуры, модели — эталон для PBR и окружения. |
| [Sketchfab](https://sketchfab.com/) | Зависит от модели | Фильтры **Downloadable** + **Free**; проверять коммерческое использование. |
| [ambientCG](https://ambientcg.com/) | **CC0** для большинства материалов | Бесшовные PBR; для земли/скал/маски в шейдерах. |

## UI-иконки (вектор) и эффекты

| Источник | Лицензии / нюансы | Заметки |
|----------|-------------------|---------|
| [game-icons.net](https://game-icons.net/) | Часто **CC BY 3.0** | Единый стиль SVG; при использовании — **атрибуция** в экране «О программе» / README сборки. |
| [JuiceFX](https://codemanu.itch.io/juicefx) | Условия на странице продукта | Генерация 2D VFX-листов; пайплайн: экспорт → атлас/WebP по бюджету из `perf-budgets.json`. |

## Уже задействовано в репозитории

- Шрифты UI: **Inter** и **Exo 2** через `@fontsource/*` в `app/src/main.tsx` (офлайн-first).
- **Kenney Game Icons (CC0)** для HUD: квест/закрыть и статусы NPC — скрипт `app/scripts/vendor-kenney-icons.mjs`, вызывается из `npm run prebuild` после генерации атласа; лицензия в `public/assets/chronos-ai-chronicles/third_party/kenney-game-icons/LICENSE.txt`.
- Тайлы биомов и кольцевые рамки портрета: процедурная генерация в `app/scripts/generate-chronos-atlas.mjs` + возможность **подмены файлов** в `public/assets/chronos-ai-chronicles/` без смены URL (см. поле `swap` в реестре).

## AAA / премиум ориентиры (не код, а пайплайн)

| Задача | Источник / инструмент | Заметки |
|--------|------------------------|---------|
| HDR / окружение для Three.js | [Poly Haven](https://polyhaven.com/hdris) CC0 | `.hdr` / EXR → PMREM в сцене; см. `WorldScene3D` / постобработку. |
| PBR поверхности | [ambientCG](https://ambientcg.com/), Poly Haven textures | Бесшовные альбедо/rough/normal под биомы. |
| Единый motion UI | CSS keyframes (`App.css`) + при необходимости `motion` | Панель NPC: stagger через `animation-delay` и класс `.chronos-npc-row-stagger` — без доп. JS-бандла; Motion можно добавить точечно для сложных сцен. |

## Процесс импорта (кратко)

1. Выбрать набор с подходящей лицензией под ваш сценарий (личное / коммерция).
2. Положить файлы под осмысленными именами в `public/assets/chronos-ai-chronicles/…` или подкаталог `third_party/<vendor>/`.
3. Обновить запись в `chronosGraphicsRegistry.ts` и при необходимости `generate-chronos-atlas.mjs` / manifest.
4. `cd app && npm run orchestrate:assets` и smoke-тест интро + игровой HUD.

Ссылки выше — ориентиры для команды; актуальные условия всегда на стороне правообладателя страницы загрузки.
