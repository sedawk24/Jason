# Current State

**Status: v1 COMPLETE + review-hardened. All phases (0, A-F) done; an external code review has been addressed.**

This is an autonomous browser-based city simulator. See `README.md` for what it is and how to run it, and `CLAUDE.md` for architecture and conventions.

---

## What Is Complete

All planned v1 phases are done:

- **Phase 0 -- Project setup & tracking.**
- **Phase A -- Foundation.** HTML/CSS layout, typed-array grid + water generation, pan/zoom camera with culling and robust fit, canvas renderer, render loop.
- **Phase B -- Dual-loop timing + seed roads + cars.** City save-state model + seed settlement; 60fps render loop on a separate, speed-controllable, tab-switch-safe tick cadence; time/speed controls + in-game date; A* pathfinding with an LRU cache; pooled cars that interpolate in real time.
- **Phase C -- Autonomous growth core.** RCI demand model (job/worker/population feedback + tax suppression + EMA), grid-aligned road extension, demand-weighted zoning (clustering + R/I separation), low-density development. The city builds itself.
- **Phase D -- Economy + utilities + density/decline.** Treasury (tax income, maintenance, bankruptcy); land-value field (downtown premium, road/commerce up, industry down); capacity-based power & water with auto-build; medium/high density gated by land value; decline + abandonment; policy sliders + economic readouts.
- **Phase E -- City services + approval + overlays + save/load.** Auto-built police/fire/education radiating coverage (scaled by funding) that feeds land value, demand, and an approval model; land-value/coverage/power data overlays; Save / Load / New City via localStorage + autosave.
- **Phase F -- Traffic congestion + tuning hardening.** Congestion that affects routing, land value, and approval; congestion overlay; robustness hardening (extreme settings stay finite and bounded).
- **Review hardening (post-v1).** Addressed `docs/review/codex-review-2026-05-29.md`: the simulation RNG state is now saved/restored (deterministic continuation after load) and the visual traffic layer uses a separate RNG; congestion is now deterministic tick-time state (cars are purely visual); loads rehydrate all derived fields and validate before mutating; building occupancy reserves utility capacity; the roads budget has real consequences; service coverage/placement are population-weighted; plus per-type service costs, grid-dimension usage, dead-state cleanup, slider a11y, and Save/Load status feedback. Covered by a persistent regression suite (`tests/sim.test.mjs`, 7 tests).

## What Is In Progress

Nothing -- v1 is complete and review-hardened.

## What Is Next

Future ideas are tracked in `docs/development/backlog.md` (pollution/environment, disasters/events, isometric view, larger maps, granular services, history charts, and a late-game economy-tightening pass).

## How To Run

```bash
cd /Volumes/1TB/GIT/Jason
python3 -m http.server 8000     # or: npx serve
# open http://localhost:8000

node tests/sim.test.mjs         # run the simulation regression suite
```

## Key References

| File | Purpose |
|------|---------|
| `docs/development/development-tracker.md` | Detailed phase tracking and change log |
| `docs/development/phases/` | Phase implementation plans |
| `docs/architecture/decisions.md` | Architectural decision log |

---

*Last updated: 2026-05-29*
