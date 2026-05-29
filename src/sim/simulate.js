import { diffuseLandValue } from './landvalue.js';
import { updateUtilities } from './utilities.js';
import { updateServices } from './services.js';
import { updateCongestion } from './congestion.js';
import { updateDemand } from './demand.js';
import { extendRoads } from './roads.js';
import { updateZoning } from './zoning.js';
import { developBuildings } from './development.js';
import { runEconomy, computeEconomyFlows } from './economy.js';
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
  updateServices(city);
  updateCongestion(city);
  updateDemand(city);
  extendRoads(city);
  updateZoning(city);
  developBuildings(city);
  runEconomy(city);
  computeStats(city);
}

// Force-recompute all derived fields without auto-building or advancing the
// clock. Used after load/new-city so the UI, overlays, and next tick see correct
// land value, coverage, congestion, utility flags/caps, stats, and economy
// readouts immediately (even while paused).
export function rehydrate(city) {
  computeStats(city);                  // per-tile population/jobs from loaded density
  updateUtilities(city, false);        // utility flags + caps, no auto-build
  updateServices(city, true, false);   // coverage, no auto-build
  updateCongestion(city, true);        // congestion from activity
  diffuseLandValue(city, true);        // land value (reads coverage + congestion)
  const flows = computeEconomyFlows(city);
  city.economy.lastIncome = flows.income;
  city.economy.lastExpenses = flows.expenses;
  city.stats.bankrupt = city.economy.treasury < 0;
  computeStats(city);                  // final aggregates incl. approval
}
