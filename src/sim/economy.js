import { B } from '../config/balance.js';

// Tax income from population and jobs, minus infrastructure/service maintenance
// (each scaled by its budget slider). Split out so the readout can be computed
// without applying it (used during load rehydration).
export function computeEconomyFlows(city) {
  const s = city.stats, p = city.params;

  const income =
    s.population * B.TAX_BASE_R * p.taxR +
    s.jobsC * B.TAX_BASE_C * p.taxC +
    s.jobsI * B.TAX_BASE_I * p.taxI;

  const expenses =
    s.roadTiles * B.MAINT_ROAD * p.budgetRoads +
    (s.powerPlants * B.POWER_MAINT + s.waterTowers * B.WATER_MAINT) * p.budgetUtil +
    s.police * B.POLICE_MAINT * p.budgetPolice +
    s.fire * B.FIRE_MAINT * p.budgetFire +
    s.school * B.SCHOOL_MAINT * p.budgetEdu;

  return { income, expenses };
}

// Apply one tick of the economy. A negative treasury is bankruptcy, which gates
// utility/service auto-build elsewhere -- so neglect stalls infrastructure and
// the city declines until the player fixes taxes or budgets.
export function runEconomy(city) {
  const e = city.economy, s = city.stats;
  const { income, expenses } = computeEconomyFlows(city);

  e.lastIncome = income;
  e.lastExpenses = expenses;
  e.treasury += income - expenses;
  s.bankrupt = e.treasury < 0;

  e.history.push(Math.round(e.treasury));
  if (e.history.length > 520) e.history.shift();
}
