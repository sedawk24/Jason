import { B } from '../config/balance.js';
import { TileType } from '../config/constants.js';
import { shuffleInPlace } from './helpers.js';

// Autonomous road extension on a regular grid. A tile may become a road only if
// it lies on the road grid (a line every ROAD_BLOCK tiles, aligned to the city
// center) AND is adjacent to an existing road. This grows a clean, connected
// street grid outward from the seed -- believable city blocks rather than sprawl.
// Expansion scales with demand pressure and the roads budget: starve the roads
// budget and the city stops spreading.

function onGrid(grid, x, y) {
  const ox = (grid.width / 2) | 0;
  const oy = (grid.height / 2) | 0;
  return ((x - ox) % B.ROAD_BLOCK === 0) || ((y - oy) % B.ROAD_BLOCK === 0);
}

export function extendRoads(city) {
  const d = city.demand;
  const pressure = Math.max(d.R, 0) + Math.max(d.C, 0) + Math.max(d.I, 0);
  if (pressure < B.ROAD_PRESSURE_MIN) return;

  const budget = Math.round(pressure * B.ROAD_BUILD_BUDGET * city.params.budgetRoads);
  if (budget < 1) return; // no roads budget -> no expansion

  const candidates = collectRoadCandidates(city);
  if (candidates.length === 0) return;
  shuffleInPlace(candidates, city.rng);

  const g = city.grid;
  const n = Math.min(candidates.length, budget);
  for (let k = 0; k < n; k++) {
    const i = candidates[k];
    g.type[i] = TileType.ROAD;
    g.density[i] = 0;
  }
  city.roadGraphDirty = true;
}

// On-grid empty-land tiles orthogonally adjacent to an existing road -- the
// growing edge of the street grid.
function collectRoadCandidates(city) {
  const g = city.grid;
  const out = [];
  for (let i = 0; i < g.size; i++) {
    if (g.type[i] !== TileType.LAND) continue;
    const x = g.xOf(i), y = g.yOf(i);
    if (!onGrid(g, x, y)) continue;
    let adj = false;
    g.forEachVonNeumann(x, y, (nx, ny, ni) => {
      if (g.type[ni] === TileType.ROAD) adj = true;
    });
    if (adj) out.push(i);
  }
  return out;
}
