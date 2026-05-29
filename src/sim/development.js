import { B } from '../config/balance.js';
import { TileType } from '../config/constants.js';
import { nearRoad } from './helpers.js';

// Building development & decline. Each zoned tile accumulates (or loses)
// "development level" based on the demand for its type; crossing a threshold
// steps its density up or down. Hysteresis (separate up/down thresholds, with a
// reset after each step) prevents flicker.
//
// Phase C develops empty -> low only (PHASE_MAX_DENSITY = 1). Phase D raises the
// density cap based on land value and adds utility gating + abandonment.
export function developBuildings(city) {
  const g = city.grid;
  for (let i = 0; i < g.size; i++) {
    const t = g.type[i];
    if (t < TileType.RESIDENTIAL || t > TileType.INDUSTRIAL) continue;
    developOne(city, i, t);
  }
}

function developOne(city, i, t) {
  const g = city.grid;
  if (!nearRoad(g, i, B.ZONE_DIST)) return;

  const demand =
    t === TileType.RESIDENTIAL ? city.demand.R :
    t === TileType.COMMERCIAL ? city.demand.C :
    city.demand.I;

  let dev = g.devLevel[i];
  if (demand > B.GROW_THRESHOLD) {
    dev = Math.min(255, dev + Math.round(B.GROW_RATE * demand));
  } else if (demand < B.DECLINE_THRESHOLD) {
    dev = Math.max(0, dev - B.DECLINE_RATE);
  }
  g.devLevel[i] = dev;

  const density = g.density[i];
  if (dev >= B.DEV_STEP_UP && density < B.PHASE_MAX_DENSITY) {
    g.density[i] = density + 1;
    g.devLevel[i] = 40; // reset partway so the next step takes time (hysteresis)
  } else if (dev <= B.DEV_STEP_DOWN && density > 0) {
    g.density[i] = density - 1;
    g.devLevel[i] = 60;
  }
}
