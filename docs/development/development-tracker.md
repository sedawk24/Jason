# Development Tracker

Detailed phase-by-phase development progress for the **Autonomous City Simulator**.

---

## Phase Overview

| Phase | Name | Status |
|-------|------|--------|
| 0 | Project setup & tracking | Complete |
| A | Foundation (grid + camera + render loop) | Complete |
| B | Dual-loop timing + seed roads + cars | Complete |
| C | Autonomous growth core (RCI + roads + zoning + dev) | Complete |
| D | Economy + utilities + density/decline | Complete |
| E | City services + approval + overlays + save/load | In Progress |
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

## Phase B: Dual-loop timing + seed roads + cars (Complete)

Goal: prove the timing model -- smooth 60fps cars on a separate, speed-controllable tick cadence.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | `src/model/City.js` skeleton (grid, tick, params, demand, economy, stats) | Complete | Full save-state shape; `createNew` + seed |
| 2 | Time accumulator + sim-speed handling in `main.js` | Complete | dt clamp + MAX_TICKS_PER_FRAME backlog drop |
| 3 | `src/ui/TimeControls.js` (pause/slow/normal/fast + date readout) | Complete | Year/Week date from tick |
| 4 | Seed settlement (tic-tac-toe roads + buildings) on new city | Complete | 69 road tiles, 8 buildings, road frontier |
| 5 | `src/traffic/pathfind.js` (A* over road tiles + LRU cache) | Complete | Binary heap; congestion-ready cost |
| 6 | `src/traffic/Car.js` + `src/traffic/TrafficSystem.js` (pool, spawn, advance) | Complete | Object pool; re-task with retries |
| 7 | `src/render/carLayer.js` (interpolated car positions) | Complete | Tile-space interpolation; zoom cull |
| 8 | `src/sim/simulate.js` minimal tick + `src/config/balance.js` (seed) | Complete | Pipeline scaffold; tunables file started |

### Verification

| Check | Status | Notes |
|-------|--------|-------|
| Cars render on roads, glide at 60fps | Pass | Headless screenshot: 60fps, 12 cars on the road grid |
| Pathfinding correct | Pass | Node test: all-road, orthogonally-contiguous routes |
| Cars advance in real time, independent of sim ticks | Pass | Node test: motion via dt; smooth regardless of tick rate |
| Pause stops ticks; cars keep moving; no fast-forward | Pass | Node test: clock frozen + fleet stable while paused; dt-clamp/backlog-drop in loop |

---

## Phase C: Autonomous growth core (Complete)

Goal: the city builds itself -- roads grow, zones fill, low-density buildings develop, driven by RCI demand and policy.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | `src/config/balance.js` (growth/demand tunables) | Complete | All magic numbers centralized |
| 2 | `src/sim/demand.js` (RCI model with feedback + EMA) | Complete | Job/worker/pop feedback; tax suppression |
| 3 | `src/sim/roads.js` (grid-aligned road extension) | Complete | Grid growth -> believable blocks (~30% road) |
| 4 | `src/sim/zoning.js` (R/C/I designation near roads) | Complete | Demand-weighted; clustering + R/I separation |
| 5 | `src/sim/development.js` (empty->low density) | Complete | devLevel ramp + hysteresis |
| 6 | `src/sim/stats.js` (population, jobs aggregates) | Complete | Writes per-tile pop/jobs; unemployment |
| 7 | `src/sim/simulate.js` (tick pipeline) | Complete | demand->roads->zoning->dev->stats |
| 8 | `src/sim/helpers.js` + RCI bars + population readout | Complete | `StatBars`; `?ticks=`/`?cam=` debug aids |

### Verification

| Check | Status | Notes |
|-------|--------|-------|
| Roads/zones/buildings grow from a seed with no input | Pass | Headless screenshot: full grid city, 24.9k pop at tick 1200 |
| Growth gradual -- never explodes or stalls at zero | Pass | Node sim: built 1.9k->8.2k over ticks 400-2000, finite, clamped |
| Believable city form (blocks, not sprawl) | Pass | 29% road share; buildings outnumber roads ~2.4:1 |
| Raising a tax suppresses that zone's demand/growth | Pass | Node test: 20% residential tax -> 0 residential pop vs 5% tax |
| Deterministic | Pass | Node test: identical population across two runs of same seed |

---

## Phase D: Economy + utilities + density/decline (Complete)

Goal: real consequences -- treasury, taxes, auto-built power/water, medium/high density, and decline.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | `src/sim/economy.js` (income, expenses, treasury, bankruptcy) | Complete | Tax income; maintenance scaled by budgets; history |
| 2 | `src/sim/landvalue.js` (center premium, roads/commerce up, industry down) | Complete | Blurred source field + static center premium |
| 3 | `src/sim/utilities.js` (capacity model + auto-build on deficit) | Complete | Cooldown + treasury gate; powers up to capacity |
| 4 | Extend `development.js` to med/high density + decline/abandonment | Complete | Land-value density caps; utilities gate occupied |
| 5 | Tax + budget sliders (`src/ui/ControlPanel.js`, `Slider.js`) | Complete | R/C/I tax + roads/utilities budgets |
| 6 | Treasury + power/water readouts (`src/ui/StatBars.js`) | Complete | Treasury, net/week, power & water gauges |
| 7 | Two-column panel layout; robust camera fit (ResizeObserver) | Complete | Fixed early-layout fit bug |

### Verification

| Check | Status | Notes |
|-------|--------|-------|
| Treasury tracks taxes/budgets; utilities auto-build on deficit | Pass | Node sim: 5 plants/5 towers auto-built; income/expense tracked |
| Downtown reaches high density; outskirts stay low | Pass | Node sim: density pyramid L5000/M3144/H37; land value 187 center vs 95 outer |
| Under-funding utilities causes visible decline | Pass | Node sim: budgetUtil=0 -> pop 28k -> 8.9k |
| Zero taxes drain the treasury (bankruptcy possible) | Pass | Node sim: treasury falls and goes negative |
| Policy UI + economic readouts render | Pass | Headless screenshot: sliders + treasury/power/water gauges |

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
| 2026-05-29 | B | Dual-loop timing (rAF render + tick accumulator), City save-state model + seed settlement, time/speed controls + date, A* pathfinding + LRU cache, pooled car system with real-time interpolation, car rendering. Verified via Node functional test (pathfinding, motion, pause) and headless screenshot (60fps, 12 cars). |
| 2026-05-29 | C | Autonomous growth core: RCI demand model (feedback + tax suppression + EMA), grid-aligned road extension, demand-weighted zoning (clustering + R/I separation), low-density development with hysteresis, stats, RCI bars + population readout. Retuned from organic to grid roads for believable blocks. Verified via Node sim (gradual growth, tax response, determinism) and headless screenshots (24.9k-pop grid city, 60+fps). |
| 2026-05-29 | D | Economy (tax income, maintenance, treasury, bankruptcy), land-value field (center premium + sources, blurred), capacity-based power/water with auto-build, med/high density gated by land value, decline + abandonment, policy UI (tax + budget sliders), economic readouts (treasury/net/power/water). Fixed same-tick-abandon bug (utilities gate occupied only) and camera fit-on-layout bug (ResizeObserver). Verified via Node sim (density pyramid, decline, bankruptcy, auto-build) and headless screenshots. |
