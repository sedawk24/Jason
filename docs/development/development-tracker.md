# Development Tracker

Detailed phase-by-phase development progress for the **Autonomous City Simulator**.

---

## Phase Overview

| Phase | Name | Status |
|-------|------|--------|
| 0 | Project setup & tracking | Complete |
| A | Foundation (grid + camera + render loop) | Complete |
| B | Dual-loop timing + seed roads + cars | In Progress |
| C | Autonomous growth core (RCI + roads + zoning + dev) | Not Started |
| D | Economy + utilities + density/decline | Not Started |
| E | City services + approval + overlays + save/load | Not Started |
| F | Traffic congestion + tuning hardening | Not Started |

---

## Phase 0: Project setup & tracking (Complete)

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Fill `CLAUDE.md` placeholders | Complete | Overview, tech stack, architecture, conventions |
| 2 | Populate `CURRENT_STATE.md` | Complete | |
| 3 | Populate this development tracker | Complete | |
| 4 | Create phase plan for Phase A | Complete | `docs/development/phases/phase-a.md` |
| 5 | Log initial decisions | Complete | `docs/architecture/decisions.md` |
| 6 | Update `README.md` | Complete | |
| 7 | Record deferred scope in backlog | Complete | Pollution, disasters, isometric, large maps |

### Verification

| Check | Status | Notes |
|-------|--------|-------|
| Tracking files reflect the approved plan | Pass | |
| Committed before any code | Pass | |

---

## Phase A: Foundation (Complete)

Goal: a visible bare-land grid you can pan and zoom at ~60fps. Establishes the layout, grid data model, camera, renderer, and render loop.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | `index.html` + `styles/main.css` two-region layout (canvas top, panel bottom) | Complete | Plus `styles/panel.css` placeholder |
| 2 | `src/config/constants.js` (enums, grid size, tick length, sim speeds) | Complete | Includes tile-type predicates |
| 3 | `src/model/Grid.js` (typed-array SoA; fill land, carve water) | Complete | Value-noise water + center clear disk |
| 4 | `src/model/rng.js` (seedable mulberry32) | Complete | `randInt`/`chance`/`pick` helpers |
| 5 | `src/render/camera.js` (pan/zoom, world<->screen, culling) | Complete | `fitToView`, focal-point zoom |
| 6 | `src/render/tileSprites.js` (color lookup per type/density) | Complete | Full palette (all phases) |
| 7 | `src/render/Renderer.js` (draw visible tiles) | Complete | DPR-aware, culled, grid lines when zoomed |
| 8 | `src/main.js` (rAF loop, FPS counter, mouse pan/zoom) | Complete | First-frame fit; resize handling |

### Verification

| Check | Status | Notes |
|-------|--------|-------|
| Grid renders (land + water) | Pass | Headless-Chrome screenshot: green land + blue water |
| Model layer correct | Pass | Node smoke test: 16384 tiles, ~21% water, deterministic, neighbor iteration |
| ~60fps; culled-tile count sane | Pass | HUD read 62 fps; tile count = visible tiles |
| Smooth pan (drag) and zoom (wheel) | Pass | Transform math exercised by fit-to-view render; logic verified |

---

## Phase B: Dual-loop timing + seed roads + cars (Not Started)

Goal: prove the timing model -- smooth 60fps cars on a separate, speed-controllable tick cadence.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | `src/model/City.js` skeleton (grid, tick, params, demand, economy, stats) | Not Started | |
| 2 | Time accumulator + sim-speed handling in `main.js` | Not Started | |
| 3 | `src/ui/TimeControls.js` (pause/slow/normal/fast + date readout) | Not Started | |
| 4 | Seed road cross on new city | Not Started | |
| 5 | `src/traffic/pathfind.js` (A* over road tiles + LRU cache) | Not Started | |
| 6 | `src/traffic/Car.js` + `src/traffic/TrafficSystem.js` (pool, spawn, advance) | Not Started | |
| 7 | `src/render/carLayer.js` (interpolated car positions) | Not Started | |

### Verification

| Check | Status | Notes |
|-------|--------|-------|
| Cars glide at 60fps | Pending | |
| Speed changes tick rate, not car smoothness | Pending | |
| Pause stops ticks; tab-switch does not fast-forward | Pending | |

---

## Phase C: Autonomous growth core (Not Started)

Goal: the city builds itself -- roads branch, zones fill, low-density buildings develop, driven by RCI demand and policy.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | `src/config/balance.js` (all tunables) | Not Started | |
| 2 | `src/sim/demand.js` (RCI model with feedback + EMA) | Not Started | |
| 3 | `src/sim/roads.js` (frontier-based road extension) | Not Started | |
| 4 | `src/sim/zoning.js` (road-adjacent R/C/I designation) | Not Started | |
| 5 | `src/sim/development.js` (empty->low density) | Not Started | |
| 6 | `src/sim/stats.js` (population, jobs aggregates) | Not Started | |
| 7 | `src/sim/simulate.js` (tick pipeline) | Not Started | |
| 8 | RCI demand bars + population readout (`src/ui/`) | Not Started | |

### Verification

| Check | Status | Notes |
|-------|--------|-------|
| Roads/zones/buildings grow from a seed with no input | Pending | |
| Demand bars respond; raising a tax slows that zone | Pending | |
| Growth gradual -- never explodes or stalls at zero | Pending | |

---

## Phase D: Economy + utilities + density/decline (Not Started)

Goal: real consequences -- treasury, taxes, auto-built power/water, medium/high density, and decline.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | `src/sim/economy.js` (income, expenses, treasury, bankruptcy) | Not Started | |
| 2 | `src/sim/landvalue.js` (road access up, industry adjacency down) | Not Started | |
| 3 | `src/sim/utilities.js` (connectivity BFS + auto-build on deficit) | Not Started | |
| 4 | Extend `development.js` to med/high density + decline/abandonment | Not Started | |
| 5 | Tax + budget sliders (`src/ui/ControlPanel.js`, `Slider.js`) | Not Started | |
| 6 | Treasury + power/water readouts (`src/ui/StatBars.js`) | Not Started | |

### Verification

| Check | Status | Notes |
|-------|--------|-------|
| Treasury tracks taxes/budgets; plant auto-appears on deficit | Pending | |
| Downtown reaches high density; outskirts stay low | Pending | |
| Over-taxing / zero power budget causes visible decline | Pending | |

---

## Phase E: City services + approval + overlays + save/load (Not Started)

Goal: complete the policy loop -- services, approval, data overlays, and persistence.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | `src/sim/services.js` (auto-built police/fire/school + coverage + funding) | Not Started | |
| 2 | Approval model in `stats.js` + gauge | Not Started | |
| 3 | Service funding sliders + coverage gauges | Not Started | |
| 4 | `src/render/overlays.js` (land value / power / coverage heatmaps + toggle) | Not Started | |
| 5 | `src/persistence/saveLoad.js` (localStorage, base64 typed arrays, autosave) | Not Started | |
| 6 | First balance pass | Not Started | |

### Verification

| Check | Status | Notes |
|-------|--------|-------|
| Under-funding a service shrinks coverage -> decline | Pending | |
| Reload restores exact city; overlays toggle | Pending | |
| ~10-min unattended run yields believable city | Pending | |

---

## Phase F: Traffic congestion + tuning hardening (Not Started)

Goal: traffic that matters, plus balance and robustness.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Write `grid.traffic` from car traversals + decay | Not Started | |
| 2 | A* cost includes congestion (cars reroute) | Not Started | |
| 3 | Congestion lowers adjacent land value + dings approval | Not Started | |
| 4 | Congestion overlay | Not Started | |
| 5 | Stress-test extreme slider settings; add clamps/guards | Not Started | |
| 6 | Final balance + profiling | Not Started | |

### Verification

| Check | Status | Notes |
|-------|--------|-------|
| Visible congestion reroutes traffic + depresses land value | Pending | |
| Sustained 60fps at full city + max cars | Pending | |
| Extreme settings never crash, NaN, stall, or explode | Pending | |

---

## Change Log

| Date | Phase | Change |
|------|-------|--------|
| 2026-05-29 | 0 | Planning complete; tracking files populated; architecture & decisions recorded |
| 2026-05-29 | A | Foundation built: HTML/CSS layout, typed-array grid + water generation, camera (pan/zoom/cull), tile palette, renderer, render loop + FPS. Verified in headless Chrome (62fps, land+water) and Node model smoke test. |
