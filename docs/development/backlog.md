# Backlog

Future features, ideas, and deferred work that surface during development. Items here are not scheduled for any specific phase. When an item is promoted to a phase, move it to the development tracker and note the date.

---

## Features

- **Pollution & environment simulation** (deferred from v1). Industry and traffic emit pollution that diffuses, lowers land value, and suppresses nearby residential growth. Would add a `pollution` field, a diffusion CA pass, and coupling into land value/demand/approval.
- **Disasters & random events** (deferred from v1). Fires, power outages, economic booms/busts, etc., with an events system and UI notifications.
- **Isometric 2.5D view** (deferred from v1). The SimCity 2000 angled look with building height; needs depth sorting, sprite art, and isometric car movement.
- **Larger maps** (e.g., 256x256+) as a selectable option, with attention to render/sim performance.
- **Granular services** beyond police/fire/education (health, parks/recreation, mass transit) as distinct coverage layers.
- **History/analytics charts** beyond the treasury sparkline (population, RCI, employment over time).
- **Scenario/challenge modes** (start conditions, goals, win/lose).
- **Map generation options** (rivers, coastline, terrain elevation) and editable seeds.

## Improvements

- Cache the static tile layer to an offscreen canvas; redraw only changed regions for large cities.
- Configurable map size and tick length from the UI.
- Sound/music and richer visual polish (day/night cycle, building sprites).
- Keyboard shortcuts for speed and overlays.

## Technical Debt

- (none yet -- greenfield)

## Research

- Optimal balance constants for believable, stable growth (ongoing tuning in Phases E/F).
- Whether to introduce a lightweight road graph structure if grid-based A* becomes a bottleneck at large city sizes.
