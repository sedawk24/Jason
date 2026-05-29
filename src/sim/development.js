import { B } from '../config/balance.js';
import { TileType, FLAG } from '../config/constants.js';
import { nearRoad } from './helpers.js';

// Building development & decline. Each zoned tile accumulates "development level"
// when its type's demand is positive and it has road access; crossing a threshold
// steps density up (capped by land value, so high-rises only appear downtown, and
// gated on power+water so a building only rises where utilities reach). An
// occupied building that loses power/water, or any tile whose demand turns
// negative or loses road access, decays; a fully-decayed empty tile is abandoned
// back to land (available for rezoning).
//
// Note: power/water gate *occupied* buildings and the build-up step -- an empty
// zoned tile (density 0) is never abandoned merely for lacking power, so it can
// ramp up the tick after it is zoned (utilities flag it the following tick).
export function developBuildings(city) {
  const g = city.grid;
  for (let i = 0; i < g.size; i++) {
    const t = g.type[i];
    if (t < TileType.RESIDENTIAL || t > TileType.INDUSTRIAL) continue;
    developOne(city, i, t);
  }
}

function maxDensityForLV(lv01) {
  if (lv01 >= B.HIGH_LV_REQ) return 3;
  if (lv01 >= B.MED_LV_REQ) return 2;
  return 1;
}

function developOne(city, i, t) {
  const g = city.grid;
  const density = g.density[i];
  const occupied = density >= 1;
  const powered = (g.flags[i] & FLAG.POWERED) !== 0;
  const watered = (g.flags[i] & FLAG.WATERED) !== 0;
  const utilities = powered && watered;
  const reachable = nearRoad(g, i, B.ZONE_DIST);
  const lv01 = g.landValue[i] / 255;
  const demand =
    t === TileType.RESIDENTIAL ? city.demand.R :
    t === TileType.COMMERCIAL ? city.demand.C :
    city.demand.I;

  let dev = g.devLevel[i];
  let declining = false;

  if (!reachable) {
    dev = Math.max(0, dev - B.DECLINE_RATE);          // lost road access
    declining = true;
  } else if (occupied && !utilities) {
    dev = Math.max(0, dev - B.DECLINE_RATE);          // built building lost power/water
    declining = true;
  } else if (demand > B.GROW_THRESHOLD) {
    const score = B.DEV_DEMAND_W * demand + B.DEV_LV_W * lv01;
    dev = Math.min(255, dev + Math.round(B.GROW_RATE * score));
  } else if (demand < B.DECLINE_THRESHOLD) {
    dev = Math.max(0, dev - B.DECLINE_RATE);          // demand turned negative
    declining = true;
  }
  g.devLevel[i] = dev;

  const cap = maxDensityForLV(lv01);
  if (dev >= B.DEV_STEP_UP && density < cap && utilities) {
    g.density[i] = density + 1;       // a new building level requires utilities
    g.devLevel[i] = 40;              // hysteresis: next step takes time
  } else if (dev <= B.DEV_STEP_DOWN && density > 0) {
    g.density[i] = density - 1;
    g.devLevel[i] = 60;
  } else if (dev <= B.DEV_STEP_DOWN && density === 0 && declining) {
    abandon(g, i);                    // fully decayed and unwanted -> empty land
  }
}

function abandon(g, i) {
  g.type[i] = TileType.LAND;
  g.density[i] = 0;
  g.devLevel[i] = 0;
  g.flags[i] = 0;
  g.population[i] = 0;
  g.jobs[i] = 0;
}
