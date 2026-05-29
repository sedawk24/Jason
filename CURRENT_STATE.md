# Current State

**Status: Phase C complete (the city builds itself). Beginning Phase D (economy, utilities, density, decline).**

This is an autonomous browser-based city simulator. See `README.md` for what it is and how to run it, and `CLAUDE.md` for architecture and conventions.

---

## What Is Complete

- **Phase 0 -- Project setup & tracking.**
- **Phase A -- Foundation.** Layout, typed-array grid + water gen, camera (pan/zoom/cull), renderer, render loop.
- **Phase B -- Dual-loop timing + seed roads + cars.** City save-state model + seed settlement; dual loop (60fps render + speed-controllable tick cadence, tab-switch safe); time/speed controls + date; A* pathfinding + LRU cache; pooled, real-time-interpolated cars.
- **Phase C -- Autonomous growth core.** The city now builds itself from the seed: an RCI demand model (job/worker/population feedback loops, tax suppression, EMA smoothing) drives grid-aligned road extension, demand-weighted zoning (with district clustering and residential/industrial separation), and low-density building development with hysteresis. Stats (population, jobs, unemployment) and RCI demand bars + readouts are live. Verified via Node simulation (gradual, stable, tax-responsive, deterministic growth) and headless screenshots (believable ~25k-pop grid city at 60+fps; ~29% road share). Debug aids: `?ticks=N` fast-forward and `?cam=x,y,zoom`.

## What Is In Progress

- **Phase D -- Economy + utilities + density/decline.** Adding the treasury/economy (tax income, maintenance expenses, bankruptcy effects); a land-value field (road access up, industry adjacency down) feeding development; autonomous power & water (connectivity flood-fill + auto-build on deficit, on a cooldown and gated by treasury); medium/high density (land-value-capped) and decline/abandonment when under-served; and the policy UI (tax + budget sliders, treasury and power/water readouts).

## What Is Next

- **Phase E -- City services + approval + overlays + save/load:** police/fire/education, approval gauge, data overlays, persistence.
- **Phase F -- Traffic congestion + tuning hardening:** congestion effects, balance, robustness.

## Key References

| File | Purpose |
|------|---------|
| `docs/development/development-tracker.md` | Detailed phase tracking and change log |
| `docs/development/phases/` | Phase implementation plans |
| `docs/architecture/decisions.md` | Architectural decision log |

---

*Last updated: 2026-05-29*
