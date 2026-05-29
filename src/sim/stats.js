import { B } from '../config/balance.js';
import { TileType } from '../config/constants.js';

// Aggregate readouts computed at the end of each tick: population, jobs, road
// count, unemployment. Per-tile population/jobs are written back to the grid so
// later phases (cars, land value) can read them.
export function computeStats(city) {
  const g = city.grid;
  let population = 0, jobsC = 0, jobsI = 0, roadTiles = 0;
  let lvSum = 0, lvCount = 0;

  for (let i = 0; i < g.size; i++) {
    const t = g.type[i];
    if (t === TileType.ROAD) {
      roadTiles++;
    } else if (t === TileType.RESIDENTIAL) {
      const c = B.densityCapacityR[g.density[i]];
      g.population[i] = c; population += c;
      lvSum += g.landValue[i]; lvCount++;
    } else if (t === TileType.COMMERCIAL) {
      const c = B.densityCapacityC[g.density[i]];
      g.jobs[i] = c; jobsC += c;
      lvSum += g.landValue[i]; lvCount++;
    } else if (t === TileType.INDUSTRIAL) {
      const c = B.densityCapacityI[g.density[i]];
      g.jobs[i] = c; jobsI += c;
      lvSum += g.landValue[i]; lvCount++;
    }
  }

  const s = city.stats;
  s.population = population;
  s.jobsC = jobsC;
  s.jobsI = jobsI;
  s.roadTiles = roadTiles;
  s.avgLandValue01 = lvCount > 0 ? (lvSum / lvCount) / 255 : 0;

  const workforce = population * B.WORKFORCE_FRAC;
  const totalJobs = jobsC + jobsI;
  s.unemployment = workforce > 0 ? Math.max(0, (workforce - totalJobs) / workforce) : 0;
}
