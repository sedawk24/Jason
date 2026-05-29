import { B } from '../config/balance.js';
import { TileType } from '../config/constants.js';

// Deterministic, tick-time traffic congestion. A road tile's congestion reflects
// the activity (population + jobs) of the buildings around it, amplified when the
// roads budget is low. This is simulation state (it feeds land value, approval,
// and routing cost) and is fully determined by the grid, so it reproduces exactly
// after a load. The visual cars (traffic/TrafficSystem) are a separate, purely
// presentational layer and do not feed into this.
//
// Recomputed every CONGEST_INTERVAL ticks; pass force=true to refresh on load.
export function updateCongestion(city, force = false) {
  if (!force && city.tick % B.CONGEST_INTERVAL !== 0) return;

  const g = city.grid, w = g.width, h = g.height;
  const r = B.CONGEST_RADIUS;
  const roadFactor = 1 + (1 - city.params.budgetRoads) * B.ROAD_UNDERFUND_CONGEST;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (g.type[i] !== TileType.ROAD) { g.traffic[i] = 0; continue; }

      let activity = 0;
      for (let dy = -r; dy <= r; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          const j = yy * w + xx;
          activity += g.population[j] + g.jobs[j];
        }
      }
      const v = activity * B.CONGEST_PER_ACTIVITY * roadFactor;
      g.traffic[i] = v > 255 ? 255 : v;
    }
  }
}
