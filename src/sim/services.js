import { B } from '../config/balance.js';
import { TileType } from '../config/constants.js';

// City services with DISTINCT roles, each on its own coverage layer:
//   Police    -> safety: raises nearby land value + residential demand
//   Fire      -> required to sustain HIGH-density buildings
//   Education -> raises commercial & industrial demand (skilled workforce)
// All three also contribute to combined coverage, which feeds approval.
//
// Because each service has its own layer, cutting one has a specific consequence
// that the others cannot mask. The engine only auto-builds a *funded* service
// whose own coverage is below target, so it never compensates for a defunded one.
//
// `force` recomputes regardless of interval (load); `allowBuild` false skips
// auto-building (rehydration).
export function updateServices(city, force = false, allowBuild = true) {
  if (!force && city.tick > 1 && city.tick % B.SERVICE_INTERVAL !== 0) return;

  const g = city.grid, n = g.size, p = city.params;

  g.covPolice.fill(0);
  g.covFire.fill(0);
  g.covEdu.fill(0);
  stamp(g, g.covPolice, TileType.POLICE, p.budgetPolice);
  stamp(g, g.covFire, TileType.FIRE, p.budgetFire);
  stamp(g, g.covEdu, TileType.SCHOOL, p.budgetEdu);

  // Combined coverage (overlay + approval) and occupancy-weighted per-type averages.
  let wP = 0, wF = 0, wE = 0, wC = 0, totalW = 0;
  for (let i = 0; i < n; i++) {
    const cp = g.covPolice[i], cf = g.covFire[i], ce = g.covEdu[i];
    const combined = (cp + cf + ce) / 3;
    g.coverage[i] = combined;
    const t = g.type[i];
    if (t < TileType.RESIDENTIAL || t > TileType.INDUSTRIAL) continue;
    const w = g.population[i] + g.jobs[i];
    if (w <= 0) continue;
    wP += cp * w; wF += cf * w; wE += ce * w; wC += combined * w; totalW += w;
  }
  const s = city.stats;
  s.covPolice01 = totalW > 0 ? (wP / totalW) / 255 : 0;
  s.covFire01 = totalW > 0 ? (wF / totalW) / 255 : 0;
  s.covEdu01 = totalW > 0 ? (wE / totalW) / 255 : 0;
  s.coverage01 = totalW > 0 ? (wC / totalW) / 255 : 0;

  if (allowBuild && s.population > 0 && city.tick - city.lastServiceBuild >= B.SERVICE_COOLDOWN) {
    autoBuild(city);
  }
}

function autoBuild(city) {
  const s = city.stats, p = city.params, g = city.grid;
  // Only funded services below target are candidates -- never build a defunded
  // type (pointless) or over-build to compensate for one.
  const candidates = [
    { type: TileType.POLICE, cov: s.covPolice01, fund: p.budgetPolice, cost: B.POLICE_COST, arr: g.covPolice },
    { type: TileType.FIRE, cov: s.covFire01, fund: p.budgetFire, cost: B.FIRE_COST, arr: g.covFire },
    { type: TileType.SCHOOL, cov: s.covEdu01, fund: p.budgetEdu, cost: B.SCHOOL_COST, arr: g.covEdu },
  ].filter((c) => c.fund > 0 && c.cov < B.COVERAGE_TARGET);
  if (candidates.length === 0) return;

  candidates.sort((a, b) => a.cov - b.cov); // most under-served first
  const pick = candidates[0];
  if (city.economy.treasury < pick.cost) return;

  const site = findServiceSite(city, pick.arr);
  if (site < 0) return;
  g.type[site] = pick.type;
  g.density[site] = 0;
  g.flags[site] = 0;
  city.economy.treasury -= pick.cost;
  city.lastServiceBuild = city.tick;
}

function stamp(g, cov, type, funding) {
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
        const v = cov[j] + strength * (1 - dist / r);
        cov[j] = v > 255 ? 255 : v;
      }
    }
  }
}

// Road-adjacent empty land near people, with the least coverage of THIS service.
function findServiceSite(city, covArr) {
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
    const score = covArr[i] - activity * 0.4;
    if (score < bestScore) { bestScore = score; best = i; }
  }
  return best;
}
