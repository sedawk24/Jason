# Current State

**Status: Phase E complete (services, approval, overlays, save/load). Beginning Phase F (traffic congestion + tuning hardening) -- the final phase.**

This is an autonomous browser-based city simulator. See `README.md` for what it is and how to run it, and `CLAUDE.md` for architecture and conventions.

---

## What Is Complete

- **Phase 0 -- Project setup & tracking.**
- **Phase A -- Foundation.** Layout, typed-array grid + water gen, camera (pan/zoom/cull + robust ResizeObserver fit), renderer, render loop.
- **Phase B -- Dual-loop timing + seed roads + cars.** City model + seed; dual loop (tab-switch safe); time/speed + date; A* pathfinding; pooled real-time cars.
- **Phase C -- Autonomous growth core.** RCI demand (feedback + tax suppression), grid-aligned roads, demand-weighted zoning, low-density development.
- **Phase D -- Economy + utilities + density/decline.** Treasury (income/maintenance/bankruptcy); land-value field; capacity-based power/water with auto-build; med/high density gated by land value; decline + abandonment; policy sliders + economic readouts.
- **Phase E -- City services + approval + overlays + save/load.** Police/fire/education auto-built service buildings radiating coverage (scaled by funding sliders) that feeds land value, residential demand, and a new approval model; data overlays (land value / service coverage / power heatmaps) via a header selector; Save / Load / New City persistence to `localStorage` (base64 typed arrays) plus autosave every 300 ticks. Verified via Node simulations (service auto-build, coverage defunding, approval vs. taxes, exact save/load roundtrip) and headless screenshots (full dashboard, overlays, ~63fps).

## What Is In Progress

- **Phase F -- Traffic congestion + tuning hardening (final).** Making traffic matter: cars write congestion into `grid.traffic` (with decay), A* routes around jams (cost term already present), and sustained congestion lowers adjacent land value and dings approval; a congestion overlay. Plus a final balance pass and robustness hardening: stress-test extreme slider settings, add guards/clamps so the sim never NaNs, stalls at zero, or explodes, and confirm sustained 60fps at full city with the maximum car fleet.

## What Is Next

- v1 complete after Phase F. Future ideas (pollution, disasters, isometric, larger maps) are in `docs/development/backlog.md`.

## Key References

| File | Purpose |
|------|---------|
| `docs/development/development-tracker.md` | Detailed phase tracking and change log |
| `docs/development/phases/` | Phase implementation plans |
| `docs/architecture/decisions.md` | Architectural decision log |

---

*Last updated: 2026-05-29*
