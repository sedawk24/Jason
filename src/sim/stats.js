import { B } from '../config/balance.js';
import { TileType } from '../config/constants.js';

// Aggregate readouts computed at the end of each tick: population, jobs, road
// count, unemployment. Per-tile population/jobs are written back to the grid so
// later phases (cars, land value) can read them.
export function computeStats(city) {
  const g = city.grid;
  let population = 0, jobsC = 0, jobsI = 0, roadTiles = 0;

  for (let i = 0; i < g.size; i++) {
    const t = g.type[i];
    if (t === TileType.ROAD) {
      roadTiles++;
    } else if (t === TileType.RESIDENTIAL) {
      const c = B.densityCapacityR[g.density[i]];
      g.population[i] = c; population += c;
    } else if (t === TileType.COMMERCIAL) {
      const c = B.densityCapacityC[g.density[i]];
      g.jobs[i] = c; jobsC += c;
    } else if (t === TileType.INDUSTRIAL) {
      const c = B.densityCapacityI[g.density[i]];
      g.jobs[i] = c; jobsI += c;
    }
  }

  const s = city.stats;
  s.population = population;
  s.jobsC = jobsC;
  s.jobsI = jobsI;
  s.roadTiles = roadTiles;

  const workforce = population * B.WORKFORCE_FRAC;
  const totalJobs = jobsC + jobsI;
  s.unemployment = workforce > 0 ? Math.max(0, (workforce - totalJobs) / workforce) : 0;
}
