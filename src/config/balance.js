// ALL tunable simulation constants live here. Tune balance/economy here only --
// never hard-code these numbers inside logic. Grows phase by phase.

export const B = {
  // --- Economy ---
  START_TREASURY: 20000,

  // --- RCI demand model ---
  WORKFORCE_FRAC: 0.5,    // fraction of population that wants to work
  DEMAND_SMOOTH: 0.1,     // EMA factor: demand moves 10% toward target each tick
  TAX_COMFORT: 0.10,      // tax rate below which there is no demand penalty
  TAX_SLOPE: 8,           // how sharply demand falls per unit of tax above comfort
  R_BASE: 0.15, R_JOBS: 0.6,
  C_BASE: 0.05, C_POP: 0.6, C_POP_REF: 2000, C_WORKERS: 0.3,
  I_BASE: 0.18, I_POP: 0.3, I_POP_REF: 3000, I_WORKERS: 0.4,

  // --- Building capacity by density [empty, low, med, high] ---
  densityCapacityR: [0, 12, 60, 200],
  densityCapacityC: [0, 8, 40, 140],
  densityCapacityI: [0, 10, 50, 160],

  // --- Autonomous road extension (grid-aligned) ---
  ROAD_BLOCK: 6,           // grid spacing: a road line every 6 tiles -> 5x5 blocks
  ROAD_PRESSURE_MIN: 0.10, // min total positive demand to extend roads at all
  ROAD_BUILD_BUDGET: 2.5,  // grid tiles added per tick scale with demand pressure

  // --- Autonomous zoning ---
  ZONE_DEMAND_MIN: 0.05,   // min total positive demand to zone at all
  ZONE_BUILD_BUDGET: 5,    // tiles zoned per tick
  ZONE_DIST: 2,            // max Chebyshev distance from a road to zone/develop
  CLUSTER_BONUS: 0.6,      // same-type neighbor bonus (forms coherent districts)
  SEP_RI: 0.4,             // residential score penalty per adjacent industrial tile

  // --- Building development & decline ---
  GROW_THRESHOLD: 0.05,    // demand above this raises a tile's development level
  DECLINE_THRESHOLD: -0.05,// demand below this lowers it
  GROW_RATE: 14,           // devLevel gained per tick = GROW_RATE * demand
  DECLINE_RATE: 20,        // devLevel lost per tick when declining
  DEV_STEP_UP: 100,        // devLevel needed to advance one density step
  DEV_STEP_DOWN: 0,        // devLevel at/under which density drops a step
  PHASE_MAX_DENSITY: 1,    // Phase C caps at LOW; Phase D raises this via land value

  // --- Traffic / cars ---
  CARS_PER_CAPITA: 0.02,
  MIN_CARS: 12,
  MAX_CARS: 300,
  SPAWN_PER_TICK: 16,
  CAR_SPEED: 2.5,
  CAR_SPEED_VAR: 0.5,
  MAX_PATHS_PER_FRAME: 8,
  PATH_CACHE_SIZE: 256,
};
