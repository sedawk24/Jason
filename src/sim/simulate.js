import { diffuseLandValue } from './landvalue.js';
import { updateUtilities } from './utilities.js';
import { updateDemand } from './demand.js';
import { extendRoads } from './roads.js';
import { updateZoning } from './zoning.js';
import { developBuildings } from './development.js';
import { runEconomy } from './economy.js';
import { computeStats } from './stats.js';

// The per-tick simulation pipeline. This is the ONLY code that mutates the model
// on a tick. Order matters:
//   - spatial fields (land value) and infrastructure (utilities) update first so
//     development reads fresh values;
//   - demand reads last tick's stats; roads/zoning/development act on demand;
//   - economy then stats run last so the UI and next tick see fresh numbers.
//
// (Phase E inserts updateServices after updateUtilities.)
export function tick(city) {
  city.tick++;
  diffuseLandValue(city);
  updateUtilities(city);
  updateDemand(city);
  extendRoads(city);
  updateZoning(city);
  developBuildings(city);
  runEconomy(city);
  computeStats(city);
}
