# Architectural Decisions

A running log of significant architectural decisions made during this project. Each entry records what was decided, why, and what alternatives were considered. This file exists so that future sessions understand the reasoning behind the current structure and do not relitigate settled decisions.

---

## 2026-05-29 -- Fully autonomous city growth (player sets policy only)

**Decision:** The city builds itself. The engine autonomously lays roads, zones land, develops buildings, and constructs utilities and services. The player never places anything directly; they only adjust policy (taxes, budgets, service funding).

**Reasoning:** This is the core product concept ("the city will build itself"). It makes the player a policy-maker and the simulation the protagonist, which is the distinctive hook versus a normal city builder.

**Alternatives considered:**
- Classic SimCity (player zones land and draws roads): rejected -- contradicts the "builds itself" concept.
- Hybrid (autonomous + light manual tools): rejected for v1 -- adds interaction UI scope; can be added later.

## 2026-05-29 -- Vanilla JS + HTML5 Canvas, no build step

**Decision:** Plain JavaScript ES modules + HTML5 Canvas + CSS, served as static files. No framework, no TypeScript, no bundler, zero npm dependencies.

**Reasoning:** Matches the user's "HTML-based website" framing and keeps the project trivially runnable (serve the folder, open the page). Canvas is the right tool for an animated tile grid with moving cars.

**Alternatives considered:**
- TypeScript + Vite: rejected -- adds a toolchain/build for marginal benefit on a self-contained project.
- React (+ Canvas): rejected -- framework overhead not justified for a single-screen panel UI.

## 2026-05-29 -- Top-down 2D tile grid (not isometric)

**Decision:** Render the city top-down with colored rectangular tiles for zones, lines for roads, and simple markers for cars.

**Reasoning:** Far simpler and more performant than isometric; smooth car movement is trivial on an axis-aligned grid; still reads clearly as a city.

**Alternatives considered:**
- Isometric 2.5D (SimCity 2000 look): rejected for v1 -- depth sorting, sprite art, and iso movement are a large amount of extra work. Logged in the backlog.

## 2026-05-29 -- Structure-of-Arrays typed-array grid (128x128)

**Decision:** Store the tile map as parallel typed arrays (`Uint8Array`/`Uint16Array`), one per attribute, indexed by `y*width + x`. Default map size 128x128 (16,384 tiles).

**Reasoning:** Typed arrays are fast, cache-friendly, GC-light, and trivially serializable to base64 for saves. SoA beats 16k object literals for both performance and memory. 128x128 gives a satisfying city while keeping per-tick cellular passes sub-millisecond.

**Alternatives considered:**
- Array of tile objects: rejected -- GC pressure and slower iteration.
- Larger maps (256x256+): deferred to backlog as an option.

## 2026-05-29 -- Dual-loop timing (render loop + tick accumulator)

**Decision:** A single `requestAnimationFrame` loop renders at ~60fps and advances the simulation via a time accumulator that fires discrete integer ticks at a speed-controllable cadence. Cars animate in real wall-clock time, interpolated between road cells, independent of the tick rate. `dt` is clamped and ticks-per-frame are capped so backgrounding a tab does not fast-forward the city.

**Reasoning:** Decouples a smooth, frame-rate-independent presentation from a deterministic, integer-stepped model. Using a `setInterval` for ticks would drift against rAF and double-advance after tab switches.

**Alternatives considered:**
- `setInterval` for ticks: rejected -- drift and tab-switch catch-up bugs.
- Stepping cars on the sim tick: rejected -- cars would stutter at slow speeds and freeze on pause.

## 2026-05-29 -- RCI demand model + local cellular rules for growth

**Decision:** A global Residential/Commercial/Industrial demand model (three EMA-smoothed scalars in [-1,1], driven by feedback loops and suppressed by taxes) decides *how much* to grow; local cellular rules decide *where* (road-adjacent, serviced, high-land-value tiles). All magic numbers live in `src/config/balance.js`.

**Reasoning:** This combination produces believable emergent growth that responds to policy while remaining stable (feedback loops self-regulate; EMA + per-tick build budgets prevent oscillation and explosions; positive base demand prevents stalling at zero). Centralizing constants makes the inevitable balance tuning tractable.

**Alternatives considered:**
- Pure cellular automaton (no global demand): rejected -- hard to tie to economy/policy.
- Pure agent-based (individual citizens/firms): rejected for v1 -- heavier to compute and tune at city scale.

## 2026-05-29 -- v1 scope: include traffic congestion + city services; defer pollution & disasters

**Decision:** Beyond the core (economy/taxes, RCI growth, power/water, animated cars), v1 includes **traffic-congestion effects** and **city services** (police/fire/education). **Pollution/environment** and **disasters/random events** are deferred.

**Reasoning:** User selection during planning. With pollution deferred, land value is driven by service coverage, road access, industry adjacency, and congestion rather than a pollution field.

**Alternatives considered:**
- Including pollution and disasters in v1: deferred to backlog to keep v1 scope focused.

## 2026-05-29 -- Grid-aligned autonomous road network

**Decision:** Roads grow on a regular grid -- a tile may become a road only if it lies on a grid line (one every `ROAD_BLOCK` tiles, aligned to the city center) and is adjacent to an existing road. Zoning and development reach up to `ZONE_DIST` tiles from a road so blocks fill in.

**Reasoning:** An earlier organic "stub" growth algorithm produced ~52% road coverage (more road than building) and looked like sprawl, not a city. The grid approach yields believable city blocks at ~30% road coverage, stays connected by construction, expands cleanly outward, and is far easier to reason about and tune. Verified in a headless simulation (29% road share, buildings outnumber roads ~2.4:1, gradual growth over ~1800 ticks).

**Alternatives considered:**
- Organic stub roads (slime-mold style): rejected -- too many roads, sprawl-like, hard to keep land reachable.
- Explicit road-segment/graph planner: rejected for v1 -- more complex than needed; the grid rule gives good results simply.

## 2026-05-29 -- Capacity-based utilities (not spatial connectivity)

**Decision:** Power and water are modeled as citywide capacity vs. draw, scaled by the utilities budget. Each building draws by density; plants/towers supply capacity; buildings are flagged powered/watered up to available capacity, and the engine auto-builds a plant/tower (cooldown- and treasury-gated) when there is a deficit.

**Reasoning:** The road grid is essentially fully connected, so a spatial flood-fill from plants would power almost everything regardless of plant location -- adding cost without gameplay value. A capacity model makes the meaningful decisions (build enough supply, fund it) crisp, drives the auto-build loop, and creates real decline when under-funded. Verified in simulation (auto-build keeps up with growth; cutting the utilities budget to 0 collapses capacity and population declines).

**Alternatives considered:**
- Spatial BFS connectivity from plants along roads: deferred to backlog -- nicer "power reaches outward" visual, but trivial on a connected grid and more expensive.
- Per-building power lines the engine must route: rejected -- too fiddly for an autonomous sim.

## 2026-05-29 -- Utilities gate occupied buildings, not empty zones

**Decision:** In development, power/water (and their absence causing decline/abandonment) apply only to *occupied* buildings (density >= 1) and to the density step-up. An empty zoned tile (density 0) is never abandoned merely for lacking power.

**Reasoning:** The pipeline updates utilities before zoning, so a tile zoned this tick has no powered flag yet. Gating empty zones on power caused every newly-zoned tile to be abandoned the same tick, collapsing the city to roads-only. Restricting the power requirement to occupied buildings (which are flagged by the next tick, since density-0 tiles draw zero) fixes this while still making real buildings decline when utilities fail.

**Alternatives considered:**
- Reordering the pipeline (zoning before utilities): workable but couples ordering to this quirk and complicates the Phase E services insertion point.

## 2026-05-29 -- Review response: determinism, congestion ownership, occupancy gating

Following an external code review (`docs/review/codex-review-2026-05-29.md`), several state-ownership and determinism issues were corrected.

**Decision (RNG):** `mulberry32` exposes `getState()`/`setState()`; the simulation RNG state is saved and restored on load, and the visual traffic layer uses a SEPARATE RNG stream (`TrafficSystem.rng`).

**Reasoning:** Previously only the initial seed was saved, so a loaded city matched at the instant of load but diverged on continuation; and frame-time car retasking consumed the sim RNG, making the simulation depend on frame timing. Separating the streams and persisting sim RNG state makes continuation deterministic (regression-tested).

**Decision (congestion ownership):** Congestion is now deterministic, tick-time simulation state computed in `sim/congestion.js` from local building activity (population + jobs near each road), scaled by the roads budget. Cars are purely visual -- they read the grid, use their own RNG, and never write `grid.traffic`. This supersedes the Phase F car-driven congestion.

**Reasoning:** Car-driven (frame-time) congestion fed land value/approval/routing -- i.e. presentation mutating the model and making the grid frame-timing-dependent. A tick-time field keeps the feature (congestion still affects the city) while restoring the model/presentation boundary and determinism.

**Decision (load rehydration):** `simulate.rehydrate(city)` force-recomputes all derived fields (utility flags/caps, coverage, congestion, land value, stats, economy readouts) without auto-building or advancing the clock; saves are validated (version + array lengths) before mutating live state.

**Reasoning:** Load previously restored only authored arrays and called `computeStats`, leaving land value/coverage/utility caps blank until enough ticks passed (and wrong indefinitely while paused).

**Decision (occupancy gating):** A building density step-up reserves spare power AND water capacity from a per-tick pool.

**Reasoning:** Density-0 zones draw zero utilities, so they were flagged powered/watered even at zero capacity and could become occupied with no real supply (e.g. utilities budget 0 still grew the city). Reserving capacity for new occupancy closes that.

**Also:** roads budget scales road expansion + congestion (no longer upside-only); service coverage and placement are weighted by population+jobs (not tile count); fire stations use their own cost; map center/extent math reads grid dimensions; dead state removed; sliders get `aria-label`s; Save/Load expose status feedback; persistent regression tests added (`tests/sim.test.mjs`).

## 2026-05-29 -- Approval is the central policy signal (drives demand) + map legend

**Decision:** Approval is set by taxes, unemployment, bankruptcy, congestion, and service coverage; it sits in a visible band (base 72 + up to ~28 from services, minus penalties -- not pegged at 100) and now directly pushes or suppresses RCI demand. The Approval readout is color-coded. A map legend overlay was added.

**Reasoning:** The budget/service sliders previously had only weak, slow effects and approval was a passive readout, so cutting budgets felt consequence-free (you just accrued money). Routing policy through a visible approval gauge that drives growth makes every lever legible: over-tax, under-fund services, or let congestion build, and approval drops and growth slows/stalls.

**Known limitation:** the three service budgets feed one pooled coverage value, so the engine compensates for cutting a single service by auto-building more of the others -- individual service sliders are therefore weak. Distinct per-service roles (police/fire/education each doing something specific) are a candidate next step (see backlog).
