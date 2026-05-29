# Current State

**Status: Phase D complete (economy, utilities, density, decline). Beginning Phase E (services, approval, overlays, save/load).**

This is an autonomous browser-based city simulator. See `README.md` for what it is and how to run it, and `CLAUDE.md` for architecture and conventions.

---

## What Is Complete

- **Phase 0 -- Project setup & tracking.**
- **Phase A -- Foundation.** Layout, typed-array grid + water gen, camera (pan/zoom/cull + robust fit), renderer, render loop.
- **Phase B -- Dual-loop timing + seed roads + cars.** City model + seed; dual loop; time/speed + date; A* pathfinding; pooled real-time cars.
- **Phase C -- Autonomous growth core.** RCI demand (feedback + tax suppression), grid-aligned roads, demand-weighted zoning, low-density development; stats + RCI/population readouts. The city builds itself.
- **Phase D -- Economy + utilities + density/decline.** Treasury (tax income, maintenance, bankruptcy); a land-value field (downtown center premium, road/commerce boosts, industry nuisance) that caps building density so high-rises form downtown and low density on the outskirts; capacity-based power & water that the engine auto-builds on deficit (cooldown- and treasury-gated); medium/high density and decline/abandonment when buildings lose utilities, access, or demand; a policy UI (R/C/I tax sliders, roads/utilities budget sliders) and economic readouts (treasury, net/week, power & water supply/demand). Verified via Node simulations (density pyramid, downtown land-value gradient, auto-build, decline on under-funding, bankruptcy on zero tax) and headless screenshots.

## What Is In Progress

- **Phase E -- City services + approval + overlays + save/load.** Adding police/fire/education as auto-built service buildings that radiate coverage (scaled by funding sliders) and affect land value, growth, and approval; a city-approval model and gauge; data overlays (land value / power / service coverage) toggled in the UI; and save/load/new-city persistence to `localStorage`. Plus a first full balance pass.

## What Is Next

- **Phase F -- Traffic congestion + tuning hardening:** congestion effects on routing and land value, stress tests, robustness, final balance.

## Key References

| File | Purpose |
|------|---------|
| `docs/development/development-tracker.md` | Detailed phase tracking and change log |
| `docs/development/phases/` | Phase implementation plans |
| `docs/architecture/decisions.md` | Architectural decision log |

---

*Last updated: 2026-05-29*
