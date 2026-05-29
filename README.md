# Autonomous City Simulator

A browser-based, SimCity-like city simulator where **the city builds itself**. You don't place buildings or zones -- you set policy (taxes, budgets, service funding) with sliders and watch an organic city grow from bare land, with cars moving along the roads.

- **Top of screen:** a top-down 2D city view (blocks, roads, animated cars).
- **Bottom of screen:** a control panel of sliders, time/speed controls, and live stat readouts.
- **Autonomous:** the engine lays roads, zones land, develops buildings, and builds utilities and services on its own, driven by a Residential/Commercial/Industrial demand model and your policies.

## Quick Start

No build step and no dependencies. ES modules must be served over http (not opened as a `file://`), so use any static server:

```bash
cd /Volumes/1TB/GIT/Jason
python3 -m http.server 8000     # or: npx serve
# then open http://localhost:8000 in a browser
```

Press play, optionally adjust the speed, and watch the city grow. Use the sliders to change tax rates and budgets and see how the city responds.

## Controls

- **Pan:** click and drag the city view. **Zoom:** mouse wheel.
- **Speed:** Pause / Slow / Normal / Fast buttons.
- **Policy:** tax sliders (residential/commercial/industrial) and budget/service-funding sliders.
- **Overlays:** toggle data heatmaps (land value, power, service coverage, congestion).
- **Save / Load / New City:** persists to the browser's `localStorage`.

## Tests

The simulation/model layer is DOM-free, so it can be exercised headlessly:

```bash
node tests/sim.test.mjs
```

This regression suite covers save/load continuation determinism, load rehydration, traffic/sim RNG isolation, the zero-utilities and zero-roads-budget consequences, population-weighted service coverage, and that growth still forms a density pyramid.

## Documentation

| File | Purpose |
|------|---------|
| `CURRENT_STATE.md` | Current build status and what is next |
| `CLAUDE.md` | Development agent instructions, architecture, and conventions |
| `docs/development/development-tracker.md` | Phase-by-phase development progress |
| `docs/development/backlog.md` | Future features and deferred ideas |
| `docs/development/phases/` | Detailed per-phase implementation plans |
| `docs/architecture/decisions.md` | Architectural decision log |

## Project Structure

```
index.html              Entry page: canvas (top) + control panel (bottom)
styles/                 CSS for layout and the control panel
src/
  main.js               Entry point; owns the dual loop (render + simulation cadence)
  config/               constants.js (enums, sizes) and balance.js (all tunable numbers)
  model/                Grid (typed-array tiles), City (save state), rng (seeded PRNG)
  sim/                  The tick pipeline: demand, roads, zoning, development,
                        utilities, services, landvalue, economy, stats
  render/               Canvas renderer, camera, tile colors, car layer, overlays
  traffic/              Pathfinding (A*), cars, traffic system
  ui/                   Control panel: sliders, stat bars, time controls
  persistence/          Save/load to localStorage
docs/                   Planning, tracking, and decision records
```

## Tech

Vanilla JavaScript (ES modules) + HTML5 Canvas + CSS. No framework, no TypeScript, no build tooling.
