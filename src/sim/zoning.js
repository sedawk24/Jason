import { B } from '../config/balance.js';
import { TileType, FLAG } from '../config/constants.js';
import { shuffleInPlace, nearRoad } from './helpers.js';

// Autonomous zoning. On empty land adjacent to a road, designate R/C/I in
// proportion to current demand, with a clustering bonus (coherent districts) and
// a residential-vs-industrial separation penalty. Bounded per tick so the city
// fills in gradually.
export function updateZoning(city) {
  const d = city.demand;
  const wR = Math.max(d.R, 0), wC = Math.max(d.C, 0), wI = Math.max(d.I, 0);
  if (wR + wC + wI < B.ZONE_DEMAND_MIN) return;

  const candidates = collectCandidates(city);
  if (candidates.length === 0) return;
  shuffleInPlace(candidates, city.rng);

  const g = city.grid;
  let budget = B.ZONE_BUILD_BUDGET;
  for (const i of candidates) {
    if (budget <= 0) break;
    const type = chooseZoneType(city, i, wR, wC, wI);
    if (type == null) continue;
    g.type[i] = type;
    g.density[i] = 0;            // zoned but undeveloped (pale color until it grows)
    g.flags[i] |= FLAG.ZONED_EMPTY;
    budget--;
  }
}

// Empty land tiles within reach of a road (so blocks fill a few tiles deep).
function collectCandidates(city) {
  const g = city.grid;
  const out = [];
  for (let i = 0; i < g.size; i++) {
    if (g.type[i] !== TileType.LAND) continue;
    if (nearRoad(g, i, B.ZONE_DIST)) out.push(i);
  }
  return out;
}

function chooseZoneType(city, i, wR, wC, wI) {
  const g = city.grid;
  const x = g.xOf(i), y = g.yOf(i);
  let nR = 0, nC = 0, nI = 0;
  g.forEachMoore(x, y, (nx, ny, ni) => {
    const t = g.type[ni];
    if (t === TileType.RESIDENTIAL) nR++;
    else if (t === TileType.COMMERCIAL) nC++;
    else if (t === TileType.INDUSTRIAL) nI++;
  });

  let sR = wR * (1 + B.CLUSTER_BONUS * nR) - B.SEP_RI * nI; // residents shun industry
  let sC = wC * (1 + B.CLUSTER_BONUS * nC);
  let sI = wI * (1 + B.CLUSTER_BONUS * nI);
  sR = Math.max(0, sR); sC = Math.max(0, sC); sI = Math.max(0, sI);

  const total = sR + sC + sI;
  if (total <= 0) return null;

  let r = city.rng() * total;
  if (r < sR) return TileType.RESIDENTIAL;
  r -= sR;
  if (r < sC) return TileType.COMMERCIAL;
  return TileType.INDUSTRIAL;
}
