import { B } from '../config/balance.js';
import { TileType } from '../config/constants.js';

// City services: police, fire, education. The engine auto-builds them where
// they're needed. Each service building radiates coverage over a radius (strength
// scaled by its funding slider); the three types sum into one combined coverage
// field. Coverage raises land value, lifts residential demand, and improves
// approval -- so under-funding shrinks coverage and the city suffers.
//
// The coverage KPI is weighted by building occupancy (population + jobs), so a
// dense underserved district matters far more than an empty zoned tile.
//
// `force` recomputes regardless of the interval (used on load); `allowBuild`
// can be set false to recompute coverage without auto-building (rehydration).
export function updateServices(city, force = false, allowBuild = true) {
  if (!force && city.tick > 1 && city.tick % B.SERVICE_INTERVAL !== 0) return;

  const g = city.grid, n = g.size, p = city.params;

  let police = 0, fire = 0, school = 0;
  for (let i = 0; i < n; i++) {
    const t = g.type[i];
    if (t === TileType.POLICE) police++;
    else if (t === TileType.FIRE) fire++;
    else if (t === TileType.SCHOOL) school++;
  }

  g.coverage.fill(0);
  stamp(g, TileType.POLICE, p.budgetPolice);
  stamp(g, TileType.FIRE, p.budgetFire);
  stamp(g, TileType.SCHOOL, p.budgetEdu);

  // Average coverage weighted by occupancy (population + jobs).
  let weighted = 0, totalW = 0;
  for (let i = 0; i < n; i++) {
    const t = g.type[i];
    if (t < TileType.RESIDENTIAL || t > TileType.INDUSTRIAL) continue;
    const w = g.population[i] + g.jobs[i];
    if (w <= 0) continue;
    weighted += g.coverage[i] * w;
    totalW += w;
  }
  city.stats.coverage01 = totalW > 0 ? (weighted / totalW) / 255 : 0;

  if (allowBuild &&
      city.stats.population > 0 &&
      city.stats.coverage01 < B.COVERAGE_TARGET &&
      city.tick - city.lastServiceBuild >= B.SERVICE_COOLDOWN) {
    buildService(city, police, fire, school);
  }
}

function stamp(g, type, funding) {
  if (funding <= 0) return;
  const r = B.SERVICE_RADIUS;
  const strength = B.SERVICE_STRENGTH * funding;
  for (let i = 0; i < g.size; i++) {
    if (g.type[i] !== type) continue;
    const bx = g.xOf(i), by = g.yOf(i);
    for (let dy = -r; dy <= r; dy++) {
      const yy = by + dy;
      if (yy < 0 || yy >= g.height) continue;
      for (let dx = -r; dx <= r; dx++) {
        const xx = bx + dx;
        if (xx < 0 || xx >= g.width) continue;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > r) continue;
        const j = yy * g.width + xx;
        const v = g.coverage[j] + strength * (1 - dist / r);
        g.coverage[j] = v > 255 ? 255 : v;
      }
    }
  }
}

function buildService(city, police, fire, school) {
  // The least-represented service is the most needed.
  let type = TileType.POLICE, min = police;
  if (fire < min) { min = fire; type = TileType.FIRE; }
  if (school < min) { min = school; type = TileType.SCHOOL; }
  const cost = type === TileType.POLICE ? B.POLICE_COST
    : type === TileType.FIRE ? B.FIRE_COST
    : B.SCHOOL_COST;
  if (city.economy.treasury < cost) return;

  const site = findServiceSite(city);
  if (site < 0) return;
  const g = city.grid;
  g.type[site] = type;
  g.density[site] = 0;
  g.flags[site] = 0;
  city.economy.treasury -= cost;
  city.lastServiceBuild = city.tick;
}

// Road-adjacent empty land where the most people/jobs have the least coverage.
function findServiceSite(city) {
  const g = city.grid;
  let best = -1, bestScore = Infinity;
  for (let i = 0; i < g.size; i++) {
    if (g.type[i] !== TileType.LAND) continue;
    const x = g.xOf(i), y = g.yOf(i);
    let roadAdj = false, activity = 0;
    g.forEachVonNeumann(x, y, (nx, ny, ni) => { if (g.type[ni] === TileType.ROAD) roadAdj = true; });
    if (!roadAdj) continue;
    g.forEachMoore(x, y, (nx, ny, ni) => { activity += g.population[ni] + g.jobs[ni]; });
    if (activity === 0) continue;
    const score = g.coverage[i] - activity * 0.4; // low coverage + high activity wins
    if (score < bestScore) { bestScore = score; best = i; }
  }
  return best;
}
