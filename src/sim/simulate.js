import { updateDemand } from './demand.js';
import { extendRoads } from './roads.js';
import { updateZoning } from './zoning.js';
import { developBuildings } from './development.js';
import { computeStats } from './stats.js';

// The per-tick simulation pipeline. This is the ONLY code that mutates the model
// on a tick. Order matters: demand reads last tick's stats; stats are recomputed
// at the end so the UI and next tick see fresh values.
//
// Later phases insert stages here: land value (before demand), utilities &
// services (before demand), economy (before stats).
export function tick(city) {
  city.tick++;
  updateDemand(city);     // global RCI pressure from population/jobs/taxes
  extendRoads(city);      // grow the road network toward demand
  updateZoning(city);     // designate road-adjacent land R/C/I
  developBuildings(city); // raise/lower building density
  computeStats(city);     // aggregate population, jobs, unemployment
}
