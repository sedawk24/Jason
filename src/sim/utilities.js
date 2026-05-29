import { B } from '../config/balance.js';
import { TileType, FLAG } from '../config/constants.js';

// Power & water. Capacity-based model: each building draws power/water by density;
// plants/towers supply capacity (scaled by the utilities budget). When draw
// exceeds capacity and the treasury allows, the engine auto-builds a plant/tower
// on cheap road-adjacent land (on a cooldown so it doesn't carpet the map).
// Buildings are flagged POWERED/WATERED up to available capacity; the rest go
// dark and will decline (handled in development).
export function updateUtilities(city) {
  const g = city.grid, n = g.size, p = city.params, e = city.economy;

  let plants = 0, towers = 0, powerDraw = 0, waterDraw = 0;
  for (let i = 0; i < n; i++) {
    const t = g.type[i];
    if (t === TileType.POWER_PLANT) plants++;
    else if (t === TileType.WATER_TOWER) towers++;
    else if (t >= TileType.RESIDENTIAL && t <= TileType.INDUSTRIAL) {
      const d = g.density[i];
      powerDraw += B.powerPer[d];
      waterDraw += B.waterPer[d];
    }
  }

  let powerCap = plants * B.POWER_OUTPUT * p.budgetUtil;
  let waterCap = towers * B.WATER_OUTPUT * p.budgetUtil;

  // Auto-build on deficit (treasury-gated, cooldown-limited).
  if (powerDraw > powerCap && e.treasury >= B.POWER_COST && city.tick - city.lastPowerBuild >= B.UTILITY_COOLDOWN) {
    const site = findUtilitySite(city);
    if (site >= 0) {
      placeUtility(g, site, TileType.POWER_PLANT);
      e.treasury -= B.POWER_COST;
      city.lastPowerBuild = city.tick;
      plants++;
      powerCap = plants * B.POWER_OUTPUT * p.budgetUtil;
    }
  }
  if (waterDraw > waterCap && e.treasury >= B.WATER_COST && city.tick - city.lastWaterBuild >= B.UTILITY_COOLDOWN) {
    const site = findUtilitySite(city);
    if (site >= 0) {
      placeUtility(g, site, TileType.WATER_TOWER);
      e.treasury -= B.WATER_COST;
      city.lastWaterBuild = city.tick;
      towers++;
      waterCap = towers * B.WATER_OUTPUT * p.budgetUtil;
    }
  }

  // Flag buildings powered/watered up to capacity.
  let pAvail = powerCap, wAvail = waterCap;
  for (let i = 0; i < n; i++) {
    const t = g.type[i];
    if (t < TileType.RESIDENTIAL || t > TileType.INDUSTRIAL) continue;
    const d = g.density[i];
    const pd = B.powerPer[d], wd = B.waterPer[d];
    if (pAvail >= pd) { g.flags[i] |= FLAG.POWERED; pAvail -= pd; } else g.flags[i] &= ~FLAG.POWERED;
    if (wAvail >= wd) { g.flags[i] |= FLAG.WATERED; wAvail -= wd; } else g.flags[i] &= ~FLAG.WATERED;
  }

  const s = city.stats;
  s.powerPlants = plants; s.waterTowers = towers;
  s.powerCap = powerCap; s.powerDraw = powerDraw;
  s.waterCap = waterCap; s.waterDraw = waterDraw;
}

function placeUtility(g, i, type) {
  g.type[i] = type;
  g.density[i] = 0;
  g.flags[i] = 0;
}

// Cheapest (lowest land value) road-adjacent empty land, away from homes.
function findUtilitySite(city) {
  const g = city.grid;
  let best = -1, bestScore = Infinity;
  for (let i = 0; i < g.size; i++) {
    if (g.type[i] !== TileType.LAND) continue;
    const x = g.xOf(i), y = g.yOf(i);
    let roadAdj = false, resNear = 0;
    g.forEachVonNeumann(x, y, (nx, ny, ni) => { if (g.type[ni] === TileType.ROAD) roadAdj = true; });
    if (!roadAdj) continue;
    g.forEachMoore(x, y, (nx, ny, ni) => { if (g.type[ni] === TileType.RESIDENTIAL) resNear++; });
    const score = g.landValue[i] + resNear * 8;
    if (score < bestScore) { bestScore = score; best = i; }
  }
  return best;
}
