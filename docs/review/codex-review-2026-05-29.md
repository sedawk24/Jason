# Codex Review: Autonomous City Simulator

Review date: 2026-05-29  
Reviewer: Codex  
Scope: static code review plus lightweight Node/browser smoke checks. Application code was not edited.

## Executive Summary

The project is impressively coherent for a fresh v1: the module layout matches the documented model/sim/presentation split, the first browser load succeeds without console errors, and the core simulation can run hundreds of ticks without NaN/crash behavior.

The main risks are not syntax or missing files. They are state ownership and persistence issues:

- Save/load does not restore the true continuation state.
- Traffic mutates model state and consumes the model RNG from the frame loop.
- Several derived fields are blank/stale immediately after load.
- A few policy sliders either have incomplete consequences or measure the wrong thing.

I would address persistence and determinism before tuning gameplay, because they affect debugging, reproduction, and user trust.

## Checks Performed

- Read `CLAUDE.md`, `CURRENT_STATE.md`, `docs/development/development-tracker.md`, `docs/development/backlog.md`, and `docs/architecture/decisions.md`.
- Imported all non-`main.js` modules in Node successfully.
- Ran a 1,000-tick Node smoke test:
  - Result: finite stats, population `101,944`, jobs `109,674`, treasury about `$3.54M`, approval `97`.
- Ran save/load roundtrip checks with a stubbed `localStorage`.
- Ran continuation/determinism checks after load.
- Ran a first browser smoke at `http://localhost:8000`.
  - Result: no console errors/warnings captured, canvas sized correctly, HUD reached about `60 fps`, and the UI updated live stats.

## Findings

### P1: Save/load does not restore deterministic continuation

Relevant code:

- `src/persistence/saveLoad.js:17-28`
- `src/persistence/saveLoad.js:45-60`
- `src/model/rng.js:7-15`
- `src/traffic/TrafficSystem.js:148-160`

`save()` stores the initial `seed`, but it does not store the current RNG state. `mulberry32()` closes over its internal state and exposes only a `next()` function, so after a load there is no way to resume the same random stream.

This means a loaded city can match at the instant of load but diverge immediately when the sim continues. I reproduced this by saving at tick 300, loading into a fresh city, then advancing both copies:

```json
{
  "firstDiff": 1,
  "aTick": 301,
  "bTick": 301,
  "aPop": 43004,
  "bPop": 42956
}
```

This directly contradicts the docs' determinism goal and the tracker claim that save/load restores the exact city.

Recommendation:

- Replace `mulberry32(seed)` with a small RNG object that exposes `next()`, `getState()`, and `setState()`.
- Save the current simulation RNG state.
- Keep traffic/visual randomness on a separate RNG stream so frame-time car behavior cannot consume the same stream as zoning/roads.
- Add a regression test: save at tick N, load, advance both cities 100 ticks, assert grid and key stats remain identical.

### P1: Loaded cities are not rehydrated before the UI/sim reads them

Relevant code:

- `src/persistence/saveLoad.js:56-60`
- `src/main.js:66-69`
- `src/sim/landvalue.js:18-19`
- `src/sim/services.js:12-13`

`load()` clears the grid and restores only `type`, `density`, and `devLevel`. That is reasonable if all derived fields are recomputed immediately. But `afterCityReplaced()` only calls `computeStats()`, then resets traffic. It does not recompute:

- `grid.landValue`
- `grid.coverage`
- utility flags
- `stats.powerPlants`
- `stats.waterTowers`
- utility draw/capacity
- `economy.lastIncome` / `economy.lastExpenses`

I reproduced this after loading a tick-300 city and calling the same `computeStats()` path used by `main.js`:

```json
{
  "before": {
    "powerPlants": 2,
    "waterTowers": 2,
    "powerCap": 8000,
    "powerDraw": 6505,
    "coverage": 0.4077,
    "avgLv": 0.544,
    "powered": 1493,
    "lvMax": 196,
    "covMax": 182
  },
  "after": {
    "powerPlants": 0,
    "waterTowers": 0,
    "powerCap": 0,
    "powerDraw": 0,
    "coverage": 0,
    "avgLv": 0,
    "powered": 0,
    "lvMax": 0,
    "covMax": 0
  }
}
```

If the game is paused after load, the UI and overlays can remain wrong indefinitely. Even if unpaused, land value and coverage may skip recomputation for one or more ticks because both modules early-return based on tick modulo.

Recommendation:

- Add a `rehydrateCity(city)` path for load/new-city that force-runs derived systems regardless of interval:
  - utilities
  - services
  - land value
  - stats
  - economy readout fields, if they are displayed
- Alternatively, persist derived arrays too. If derived arrays are intentionally omitted, force recomputation must be explicit and test-covered.
- Validate save version and array lengths before mutating the live `city`; currently a corrupt save can partially mutate state before throwing.

### P1: Traffic breaks the documented model/sim/presentation boundary

Relevant code:

- `src/traffic/TrafficSystem.js:97-145`
- `src/traffic/TrafficSystem.js:148-160`
- `src/main.js:148`
- `CLAUDE.md` layer discipline

The docs say the model advances only through `simulate.tick(city)` and that presentation is read-only with respect to saved model state. Traffic currently violates both:

- `TrafficSystem.advance(dt)` runs every render frame, including while paused.
- It writes into `city.grid.traffic`.
- `grid.traffic` is read by land value, approval, overlays, and routing.
- Frame-time car retasking consumes `city.rng()`.

Even if congestion is meant to affect simulation, ownership is currently ambiguous: it lives in presentation timing, writes into model state, is not saved, and consumes the same RNG stream used by core sim systems.

Direct RNG proof:

```json
{
  "nextA_without_pause_traffic": 0.4722949471324682,
  "nextB_after_10s_traffic_advance": 0.07295497483573854
}
```

Same seed, same city, but simply advancing traffic changes the next simulation random value.

Recommendation:

- Decide one clear ownership model:
  - If congestion is simulation state, update it from the simulation pipeline or a deterministic tick-time traffic subsystem, save/rehydrate it, and keep it testable.
  - If cars are visual, keep frame-time traffic outside `City` and do not feed it back into land value/approval.
- Use separate RNGs:
  - `city.simRng` for roads/zoning/development.
  - `traffic.rng` for car colors/speeds/routes.
- Avoid consuming sim RNG from `advance(dt)`.

### P2: Zero utility funding still allows occupied buildings to appear

Relevant code:

- `src/sim/utilities.js:50-58`
- `src/sim/development.js:63-66`

Density-0 zones draw zero power/water. In `updateUtilities()`, a zero draw means `pAvail >= pd` and `wAvail >= wd` are true even when citywide capacity is zero. Those empty zones get `POWERED`/`WATERED` flags, so `developBuildings()` can promote them to density 1 with no actual utility supply.

With `budgetUtil = 0`, I observed population and jobs repeatedly appearing despite `powerCap = 0` and `waterCap = 0`:

```json
[
  [100, 168, 400, 51, 0],
  [200, 216, 468, 63, 0],
  [300, 96, 426, 50, 0],
  [400, 168, 420, 55, 0],
  [500, 216, 446, 64, 0]
]
```

Tuple format: `[tick, population, jobs, powerDraw, powerCap]`.

Recommendation:

- Do not mark empty zones as powered/watered merely because their draw is zero.
- For first occupancy, require either spare capacity or existing serviceable utility infrastructure.
- A clean model is: density-0 zones may accumulate development progress, but the density step to 1 should reserve/consume capacity in the same pass that grants occupancy.

### P2: Road budget has no downside when underfunded

Relevant code:

- `src/sim/economy.js:16-19`
- `src/ui/ControlPanel.js:15`

`budgetRoads` is only used to scale road maintenance expense. It does not affect road construction, road quality, land value, traffic, or approval. A player can set roads to `0%` and still get autonomous road expansion while eliminating road maintenance costs.

This makes the Roads slider economically upside-only when lowered.

Recommendation:

- Tie road budget to at least one gameplay consequence:
  - slower `ROAD_BUILD_BUDGET`
  - lower road/access land-value contribution
  - higher congestion
  - approval penalty
  - road decay/blocked expansion if severely underfunded

### P2: Service coverage is tile-weighted, not population-weighted

Relevant code:

- `src/sim/services.js:30-35`
- `src/config/balance.js:75`
- `src/sim/stats.js:58-64`

The balance comment says services auto-build when average coverage over population is below target, but the code averages `grid.coverage` over every R/C/I tile, including empty zoned tiles, and gives a density-0 tile the same weight as a high-density tile.

This value feeds:

- service auto-building
- residential demand
- approval
- land value

Likely symptoms:

- Overbuilding services for empty zoned land.
- Underreacting to dense underserved residential areas.
- Approval/demand not matching the actual population experience.

Recommendation:

- Compute coverage weighted by population for residential effects/approval.
- Consider separate coverage metrics for residential population and job centers if C/I service access matters.
- Exclude density-0 zones from the main coverage KPI unless the design intentionally treats vacant zoned land as service demand.

### P2: Traffic endpoints can go stale when buildings/zones change

Relevant code:

- `src/traffic/TrafficSystem.js:35-56`
- `src/sim/zoning.js:20-27`
- `src/sim/development.js:75-81`
- `src/sim/utilities.js:67-70`
- `src/sim/services.js:78-83`

Traffic endpoints are road tiles adjacent to buildings, but they are rebuilt only when `city.roadGraphDirty` is true. The flag is set when roads extend, but not when zoning, abandonment, utilities, or services change which roads are adjacent to buildings.

Early in the sim, frequent road growth may hide this. Later, or under policies where zoning/building changes continue without road changes, traffic origins/destinations can lag behind the city.

Recommendation:

- Split `roadGraphDirty` from `trafficEndpointsDirty`.
- Mark endpoint dirty when any tile changes into/out of a building/service/utility type.
- Or rebuild endpoints on a low-frequency interval if the full scan is cheap enough.

### P3: Fire service cost accidentally uses police cost

Relevant code:

- `src/sim/services.js:73`
- `src/config/balance.js:76`

`buildService()` charges `SCHOOL_COST` for schools and `POLICE_COST` for everything else. `FIRE_COST` currently equals `POLICE_COST`, so this is hidden today, but the config exposes separate values and future tuning would silently fail for fire stations.

Recommendation:

- Use an explicit cost lookup by service type.

### P3: Future map-size support is undercut by module-level WIDTH/HEIGHT constants

Relevant code:

- `src/sim/roads.js:2,13-17`
- `src/sim/landvalue.js:2,12-14,51-55`
- `src/render/camera.js:1,53-78`

`Grid` accepts custom width/height, and larger maps are in the backlog, but several systems import global `WIDTH`/`HEIGHT` instead of reading `city.grid.width` / `city.grid.height`.

This is fine for v1's fixed 128x128 map, but it will be easy to miss when map-size options are added.

Recommendation:

- Before implementing configurable maps, move center/extent calculations to use the active grid dimensions.
- Consider passing grid dimensions into `Camera` instead of hard-coding constants.

### P3: Dead/stale state is accumulating

Relevant code:

- `src/model/City.js:40,44,147-160`
- `src/config/constants.js:27-33`
- `src/sim/zoning.js:26`
- `src/sim/roads.js:43-57`

Examples:

- `city.roadFrontier` is maintained but `roads.js` scans the whole grid instead of using it.
- `FLAG.ROAD_ADJ` is never used.
- `FLAG.ZONED_EMPTY` is set but never read and not cleared when a zone becomes occupied.
- `stats.industrialOutput` and `stats.goodsConsumed` are initialized/reset inconsistently and unused.

None of this breaks v1 today, but it makes future logic easier to wire to stale assumptions.

Recommendation:

- Remove dead fields now, or add comments that they are reserved for a specific future phase.
- If `ZONED_EMPTY` remains, clear it when density becomes positive and persist/recompute it consistently.

## Additional Improvements

### Save/load UX

The Save and Load buttons have no success/failure feedback. `save()` and `load()` return booleans, but the UI ignores them except for deciding whether to call `afterCityReplaced()`.

Recommendation:

- Add a small status text/toast for Saved, Loaded, No save found, and Save failed.
- Disable Load when `hasSave()` is false, or show a clear no-op message.

### Slider accessibility

The range inputs are visually labeled by nearby text, but the inputs are not programmatically associated with labels.

Recommendation:

- Wrap each slider in a `<label>` or assign `id`/`for` plus `aria-label`.

### Service placement scoring

`findServiceSite()` counts nearby residential/commercial tiles, not people/jobs. A high-density tile and low-density tile have equal pull.

Recommendation:

- Weight candidate scoring by `grid.population[ni]` and/or `grid.jobs[ni]`.

### Economy tuning

The backlog already notes late-game surplus. The 1,000-tick smoke produced about `$3.54M` treasury at default settings. That may be acceptable for v1, but once persistence/determinism are fixed, economy tightening should be tested with both default and intentionally bad policies.

## Suggested Fix Order

1. Fix RNG ownership and save/load continuation determinism.
2. Add explicit load rehydration for derived fields and UI readouts.
3. Decide whether traffic congestion is simulation state or visual state, then enforce that boundary.
4. Fix utility gating for first occupancy.
5. Give road budget a real consequence.
6. Rework service coverage to be population-weighted.
7. Clean up smaller correctness/debt items: fire cost lookup, endpoint dirty flag, dead flags/state.

## Regression Tests Worth Adding

- `save/load continuation`: run city A to tick N, save, load city B, advance both M ticks, assert grid/state equality.
- `load rehydrate`: after load while paused, assert land value, coverage, utility caps/draw, and powered/watered counts match the saved city or forced recomputation result.
- `traffic rng isolation`: advancing traffic while paused must not change the next simulation RNG value.
- `zero utilities`: with `budgetUtil = 0`, population/jobs should not grow from new occupancy unless that is an explicit design goal.
- `road budget`: with `budgetRoads = 0`, verify the chosen penalty occurs.
- `service coverage weighting`: high-density unserved residential should lower coverage/approval more than an empty zoned tile.

