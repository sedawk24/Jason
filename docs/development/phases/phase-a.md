# Phase A -- Foundation (grid + camera + render loop)

**Goal:** a visible bare-land grid you can pan and zoom at ~60fps. This establishes the page layout, the tile data model, the camera, the renderer, and the render loop that every later phase builds on.

## Scope

In: HTML/CSS two-region layout, constants, grid (land + water), seeded RNG, camera (pan/zoom/cull), tile colors, renderer, render loop, FPS counter, mouse input.

Out (later phases): any simulation, ticks, cars, UI sliders, economy.

## Files

| File | Responsibility |
|------|----------------|
| `index.html` | Page shell: `<canvas id="cityCanvas">` (top) + `<div id="panel">` (bottom); loads `src/main.js` as a module |
| `styles/main.css` | Flex-column layout: canvas region fills available space; panel fixed height at bottom |
| `styles/panel.css` | Placeholder panel styling (expanded in later phases) |
| `src/config/constants.js` | `TileType`, `Density`, `FLAG` enums; `WIDTH`/`HEIGHT`; `TILE_SIZE`; `TICK_DAYS`; `SIM_SPEEDS`; `MAX_TICKS_PER_FRAME` |
| `src/model/rng.js` | `mulberry32(seed)` -> function returning floats in [0,1); helpers `randInt`, `pick` |
| `src/model/Grid.js` | SoA typed arrays; `idx`, `inBounds`, neighbor iteration; `generate(rng)` to fill land and carve a water body |
| `src/render/camera.js` | Pan offset + zoom; `worldToScreen`/`screenToWorld`; `visibleTileBounds` for culling |
| `src/render/tileSprites.js` | `colorFor(type, density)` color lookup |
| `src/render/Renderer.js` | Resize handling (devicePixelRatio); draw only culled visible tiles as rects; water/land |
| `src/main.js` | Construct grid/camera/renderer; `requestAnimationFrame` loop; FPS counter; mouse drag-to-pan and wheel-to-zoom |

## Data model (Phase A subset)

`Grid` allocates the full attribute set now (so later phases don't reshape it), but Phase A only populates `type` (LAND/WATER). `generate(rng)` fills everything with LAND, then carves an organic water body (value-noise threshold or a few random-walk "lakes/river") using the seeded RNG so it's reproducible.

## Camera & rendering

- Camera holds `{ x, y, zoom }` in world units; default centered on the map, zoom chosen so the whole map roughly fits.
- `Renderer.draw()`: clear; compute visible tile bounds from the camera; loop only those tiles; fill each with `colorFor(...)`. At low zoom, optionally draw a subtle grid line only when zoomed in past a threshold.
- Handle `devicePixelRatio` and window resize so the canvas stays crisp and correctly sized.

## Verification

| Check | How |
|-------|-----|
| Grid renders (land + water) | Open `http://localhost:8000`; see a green landmass with a blue water body |
| Smooth pan | Click-drag moves the map smoothly |
| Smooth zoom | Mouse wheel zooms toward the cursor; no jitter |
| ~60fps | FPS counter reads ~60; only visible tiles are drawn (log culled bounds) |
| Resize | Resizing the window keeps the canvas crisp and correctly proportioned |

## Done when

The page shows a pannable, zoomable bare-land map at ~60fps, with the grid data model and render pipeline in place for Phase B to add the simulation tick loop and cars.
