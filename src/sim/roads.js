import { B } from '../config/balance.js';
import { TileType, WIDTH, HEIGHT } from '../config/constants.js';
import { shuffleInPlace } from './helpers.js';

// Autonomous road extension on a regular grid. A tile may become a road only if
// it lies on the road grid (a line every ROAD_BLOCK tiles, aligned to the city
// center) AND is adjacent to an existing road. This grows a clean, connected
// street grid outward from the seed: lines extend at their ends, and new
// perpendicular lines sprout where an extending line crosses a grid intersection.
// The result is believable city blocks (~1/ROAD_BLOCK of tiles are road) instead
// of sprawl. Expansion rate scales with demand pressure.

const OX = (WIDTH / 2) | 0;
const OY = (HEIGHT / 2) | 0;

function onGrid(x, y) {
  return ((x - OX) % B.ROAD_BLOCK === 0) || ((y - OY) % B.ROAD_BLOCK === 0);
}

export function extendRoads(city) {
  const d = city.demand;
  const pressure = Math.max(d.R, 0) + Math.max(d.C, 0) + Math.max(d.I, 0);
  if (pressure < B.ROAD_PRESSURE_MIN) return;

  const candidates = collectRoadCandidates(city);
  if (candidates.length === 0) return;
  shuffleInPlace(candidates, city.rng);

  const g = city.grid;
  const budget = Math.min(candidates.length, Math.max(1, Math.round(pressure * B.ROAD_BUILD_BUDGET)));
  for (let k = 0; k < budget; k++) {
    const i = candidates[k];
    g.type[i] = TileType.ROAD;
    g.density[i] = 0;
  }

  city.roadGraphDirty = true;
  city.refreshRoadFrontier();
}

// On-grid empty-land tiles orthogonally adjacent to an existing road -- the
// growing edge of the street grid.
function collectRoadCandidates(city) {
  const g = city.grid;
  const out = [];
  for (let i = 0; i < g.size; i++) {
    if (g.type[i] !== TileType.LAND) continue;
    const x = g.xOf(i), y = g.yOf(i);
    if (!onGrid(x, y)) continue;
    let adj = false;
    g.forEachVonNeumann(x, y, (nx, ny, ni) => {
      if (g.type[ni] === TileType.ROAD) adj = true;
    });
    if (adj) out.push(i);
  }
  return out;
}
