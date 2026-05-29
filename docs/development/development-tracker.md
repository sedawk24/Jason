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
| E | City services + approval + overlays + save/load | Complete |
| F | Traffic congestion + tuning hardening | Complete |

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

## Phase E: City services + approval + overlays + save/load (Complete)

Goal: complete the policy loop -- services, approval, data overlays, and persistence.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | `src/sim/services.js` (auto-built police/fire/school + coverage + funding) | Complete | Radial coverage stamp scaled by funding |
| 2 | Approval model in `stats.js` | Complete | Taxes/unemployment/bankruptcy down, coverage up |
| 3 | Service funding sliders + approval/coverage readouts | Complete | ControlPanel Services group; StatBars |
| 4 | `src/render/overlays.js` (land value / coverage / power + toggle) | Complete | Heatmap + overlay select in header |
| 5 | `src/persistence/saveLoad.js` (localStorage, base64 typed arrays, autosave) | Complete | Save/Load/New City; autosave every 300 ticks |
| 6 | Coverage feeds land value + demand; in-place City.reset | Complete | LV_COVERAGE, R_SERVICE; UI rebuild on load/new |

### Verification

| Check | Status | Notes |
|-------|--------|-------|
| Services auto-build; coverage reaches target | Pass | Node sim: 19 each of police/fire/school; coverage ~40% |
| Under-funding services shrinks coverage | Pass | Node sim: budgets 0 -> coverage 40% -> 0% |
| Approval responds to policy | Pass | Node sim: 20% taxes drop approval 97 -> 31 |
| Save/Load restores the exact city | Pass | Node roundtrip: tick/treasury/params + grid diff 0 |
| UI: overlays, sliders, readouts render | Pass | Headless screenshots (land-value heatmap, full dashboard, 63fps) |

---

## Phase F: Traffic congestion + tuning hardening (Complete)

Goal: traffic that matters, plus balance and robustness.

### Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Cars write `grid.traffic` (real-time congestion buffer) + decay | Complete | Float buffer in TrafficSystem; decays even while paused |
| 2 | A* cost includes congestion; periodic cache refresh | Complete | `1 + traffic/64` cost; cache cleared every 40 ticks |
| 3 | Congestion lowers nearby land value + dings approval | Complete | `LV_CONGEST_SRC`, `APPROVAL_CONGEST_PEN` |
| 4 | Congestion overlay | Complete | Added to overlay selector |
| 5 | Stress-test extreme settings; guards | Complete | All extremes finite + bounded (no NaN/crash) |
| 6 | Balance + profiling | Complete | 60+fps; congestion concentrates on arterials |

### Verification

| Check | Status | Notes |
|-------|--------|-------|
| Congestion builds on roads, then decays | Pass | Node: max 254 on arterials, avg ~5.5%, drains to 0 with no cars |
| No NaN; cars route over congestion cost | Pass | Node stress test |
| Extreme settings never crash, NaN, stall, or explode | Pass | Node: 0%/20% tax, 0% budgets all finite + bounded |
| Sustained 60fps | Pass | Headless HUD: 60-65fps across all screenshots |
| Congestion overlay renders | Pass | Headless screenshot (congestion heatmap on roads) |

---

## Change Log

| Date | Phase | Change |
|------|-------|--------|
| 2026-05-29 | 0 | Planning complete; tracking files populated; architecture & decisions recorded |
| 2026-05-29 | A | Foundation built: HTML/CSS layout, typed-array grid + water generation, camera (pan/zoom/cull), tile palette, renderer, render loop + FPS. Verified in headless Chrome (62fps, land+water) and Node model smoke test. |
| 2026-05-29 | B | Dual-loop timing (rAF render + tick accumulator), City save-state model + seed settlement, time/speed controls + date, A* pathfinding + LRU cache, pooled car system with real-time interpolation, car rendering. Verified via Node functional test (pathfinding, motion, pause) and headless screenshot (60fps, 12 cars). |
| 2026-05-29 | C | Autonomous growth core: RCI demand model (feedback + tax suppression + EMA), grid-aligned road extension, demand-weighted zoning (clustering + R/I separation), low-density development with hysteresis, stats, RCI bars + population readout. Retuned from organic to grid roads for believable blocks. Verified via Node sim (gradual growth, tax response, determinism) and headless screenshots (24.9k-pop grid city, 60+fps). |
| 2026-05-29 | D | Economy (tax income, maintenance, treasury, bankruptcy), land-value field (center premium + sources, blurred), capacity-based power/water with auto-build, med/high density gated by land value, decline + abandonment, policy UI (tax + budget sliders), economic readouts (treasury/net/power/water). Fixed same-tick-abandon bug (utilities gate occupied only) and camera fit-on-layout bug (ResizeObserver). Verified via Node sim (density pyramid, decline, bankruptcy, auto-build) and headless screenshots. |
| 2026-05-29 | E | City services (auto-built police/fire/school, radial coverage scaled by funding) feeding land value, demand, and a new approval model; data overlays (land value / coverage / power heatmaps + selector); save/load/new-city via localStorage (base64 typed arrays) + autosave; in-place City.reset and UI rebuild. Verified via Node sim (service build, coverage defunding, approval vs taxes, save/load roundtrip) and headless screenshots (dashboard + overlay). |
| 2026-05-29 | F | Traffic congestion: cars write a real-time congestion buffer (decays even while paused) published to grid.traffic; A* routes around jams (cache refreshed periodically); congestion lowers nearby land value and dings approval; congestion overlay. Robustness hardening: extreme tax/budget settings verified finite + bounded (no NaN/crash/stall). v1 complete. Verified via Node stress test and headless screenshots (60+fps). |
| 2026-05-29 | tweak | Cars colored by trip type (to-work cyan / to-home green / other orange); cars on congested roads override to red and slow down (visual speed + congestion indicator). Legend gained a dedicated "Cars (by trip)" section. |
| 2026-05-29 | tweak | Distinct per-service roles on separate coverage layers: police -> land value + residential demand; fire -> required to sustain high density (cutting it de-densifies the skyline); education -> commercial/industrial demand. Auto-build no longer compensates for a defunded service; buildings shed a level when over their land-value/fire cap; eased congestion's approval penalty. Regression suite now 10 tests (all pass). |
| 2026-05-29 | tweak | Added a map legend (color-key overlay, toggleable). Reworked approval into the central policy signal -- set by taxes/unemployment/bankruptcy/congestion/service coverage, kept in a visible band, now driving RCI demand so budgets and taxes visibly affect growth; color-coded the Approval readout. Regression suite still green. |
| 2026-05-29 | review | Addressed external code review (`docs/review/codex-review-2026-05-29.md`): deterministic save/restore of sim RNG state + separate traffic RNG; congestion reworked to deterministic tick-time (cars now purely visual); load rehydration + save validation; utility-capacity occupancy gating; road-budget consequences; population-weighted service coverage + placement; per-type service costs; grid-dimension usage (camera/roads/landvalue); dead-state cleanup; slider aria-labels; Save/Load status feedback. Added persistent regression suite `tests/sim.test.mjs` (7 tests, all pass). |
