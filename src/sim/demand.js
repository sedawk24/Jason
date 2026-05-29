import { B } from '../config/balance.js';
import { clamp, lerp } from './helpers.js';

// The RCI demand model -- the economic heart. Three EMA-smoothed scalars in
// [-1, 1] (positive = build, negative = abandon), driven by feedback loops:
//
//   - Residential rises when jobs outnumber workers (jobs need people), falls
//     when workers outnumber jobs (nowhere to work). Suppressed by R tax.
//   - Commercial & Industrial rise when there are spare workers to hire and a
//     population to serve. Suppressed by their taxes.
//
// These loops self-regulate: too much industry -> jobs exceed workers ->
// residential demand climbs and C/I demand falls, until they rebalance. Positive
// base demands guarantee a seed city always has a path to grow.
const taxPenalty = (rate) => Math.max(0, (rate - B.TAX_COMFORT) * B.TAX_SLOPE);

export function updateDemand(city) {
  const s = city.stats;
  const p = city.params;

  const workforce = Math.max(s.population * B.WORKFORCE_FRAC, 1);
  const totalJobs = s.jobsC + s.jobsI;
  const jobsPerWorker = totalJobs / workforce;
  const jobSurplus = clamp(jobsPerWorker - 1, -1, 1);    // >0: jobs need workers (draws residents)
  const workerSurplus = Math.max(clamp(1 - jobsPerWorker, -1, 1), 0); // >0: spare workers for new C/I

  const popPressureC = clamp(s.population / B.C_POP_REF, 0, 1);
  const popPressureI = clamp(s.population / B.I_POP_REF, 0, 1);

  // Approval is the city's desirability: a well-run city (high approval) draws
  // people and business; a poorly-run one (high taxes, no services, congestion,
  // bankruptcy) pushes demand down -- eventually negative, so the city shrinks.
  const approvalPush = B.APPROVAL_DEMAND * (s.approval / 100 - B.APPROVAL_NEUTRAL);

  // Distinct service effects: police (safety) lifts residential demand;
  // education (skilled workforce) lifts commercial & industrial demand.
  const targetR = B.R_BASE + B.R_JOBS * jobSurplus + B.R_SERVICE * s.covPolice01 - taxPenalty(p.taxR) + approvalPush;
  const targetC = B.C_BASE + B.C_POP * popPressureC + B.C_WORKERS * workerSurplus + B.EDU_CI * s.covEdu01 - taxPenalty(p.taxC) + approvalPush;
  const targetI = B.I_BASE + B.I_POP * popPressureI + B.I_WORKERS * workerSurplus + B.EDU_CI * s.covEdu01 - taxPenalty(p.taxI) + approvalPush;

  const d = city.demand;
  d.R = lerp(d.R, clamp(targetR, -1, 1), B.DEMAND_SMOOTH);
  d.C = lerp(d.C, clamp(targetC, -1, 1), B.DEMAND_SMOOTH);
  d.I = lerp(d.I, clamp(targetI, -1, 1), B.DEMAND_SMOOTH);
}
