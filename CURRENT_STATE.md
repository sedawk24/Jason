# Current State

**Status: Phase A complete (foundation renders). Beginning Phase B (dual-loop timing + cars).**

This is an autonomous browser-based city simulator. See `README.md` for what it is and how to run it, and `CLAUDE.md` for architecture and conventions.

---

## What Is Complete

- **Phase 0 -- Project setup & tracking.** Architecture, conventions, phases, and decisions documented.
- **Phase A -- Foundation.** Two-region HTML/CSS layout (canvas top, control panel bottom); typed-array (SoA) tile grid with deterministic land/water generation; pan/zoom camera with viewport culling and fit-to-view; canvas renderer with the full tile palette; `requestAnimationFrame` render loop with an FPS counter. Verified at ~60fps in headless Chrome and via a Node model smoke test.

## What Is In Progress

- **Phase B -- Dual-loop timing + seed roads + cars.** Adding the `City` model skeleton (the saved state), the dual-loop timing (60fps render + a separate speed-controllable tick cadence via a time accumulator), time/speed controls, a seed road cross, A* pathfinding over road tiles, and an animated car system. Goal: cars that glide smoothly at 60fps regardless of simulation speed, with pause and correct tab-switch behavior.

## What Is Next

- **Phase C -- Autonomous growth core:** RCI demand, road extension, zoning, low-density development; the city starts building itself.
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
