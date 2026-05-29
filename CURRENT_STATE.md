# Current State

**Status: Phase B complete (timing + cars working). Beginning Phase C (autonomous growth core).**

This is an autonomous browser-based city simulator. See `README.md` for what it is and how to run it, and `CLAUDE.md` for architecture and conventions.

---

## What Is Complete

- **Phase 0 -- Project setup & tracking.** Architecture, conventions, phases, and decisions documented.
- **Phase A -- Foundation.** HTML/CSS layout, typed-array grid with deterministic land/water generation, pan/zoom camera with culling, canvas renderer, render loop + FPS counter.
- **Phase B -- Dual-loop timing + seed roads + cars.** The `City` save-state model with a seed settlement (tic-tac-toe roads + buildings); the dual loop (60fps render + a speed-controllable tick cadence via a time accumulator, with dt-clamp and backlog-drop so tab-switching never fast-forwards); time/speed controls (Pause/Slow/Normal/Fast) and an in-game date; A* pathfinding over roads with an LRU cache; a pooled car system whose cars interpolate in real time (smooth at any sim speed, including paused); car rendering. Verified via a Node functional test (pathfinding correctness, motion, pause behavior) and a headless screenshot (60fps, 12 cars driving the road grid).

## What Is In Progress

- **Phase C -- Autonomous growth core.** Filling the `simulate.tick` pipeline so the city builds itself: an RCI (Residential/Commercial/Industrial) demand model with feedback loops and tax suppression; frontier-based road extension; zoning of road-adjacent land; low-density building development; and basic stats (population, jobs). Adding RCI demand bars and a population readout to the panel. Goal: from the seed, roads branch and zones fill on their own, responding to tax policy, with gradual (non-explosive, non-stalling) growth.

## What Is Next

- **Phase D -- Economy + utilities + density/decline:** treasury, taxes, auto-built power/water, medium/high density, decline.
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
