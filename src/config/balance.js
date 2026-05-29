// ALL tunable simulation constants live here. Tune balance/economy here only --
// never hard-code these numbers inside logic.

export const B = {
  // --- Economy ---
  START_TREASURY: 20000,
  TAX_BASE_R: 0.5, TAX_BASE_C: 0.9, TAX_BASE_I: 1.0, // income per capita/job per unit tax rate
  MAINT_ROAD: 1.0,        // upkeep per road tile (scaled by roads budget)
  POWER_MAINT: 90,        // upkeep per power plant (scaled by utilities budget)
  WATER_MAINT: 45,        // upkeep per water tower (scaled by utilities budget)

  // --- RCI demand model ---
  WORKFORCE_FRAC: 0.5,
  DEMAND_SMOOTH: 0.1,
  TAX_COMFORT: 0.10,
  TAX_SLOPE: 8,
  R_BASE: 0.15, R_JOBS: 0.6,
  C_BASE: 0.05, C_POP: 0.6, C_POP_REF: 2000, C_WORKERS: 0.3,
  I_BASE: 0.18, I_POP: 0.3, I_POP_REF: 3000, I_WORKERS: 0.4,

  // --- Building capacity by density [empty, low, med, high] ---
  densityCapacityR: [0, 12, 60, 200],
  densityCapacityC: [0, 8, 40, 140],
  densityCapacityI: [0, 10, 50, 160],

  // --- Land value field ---
  LV_BASE: 30,
  LV_CENTER: 135,         // downtown premium: smooth gradient peaking at city center
  LV_ROAD_SRC: 16,        // roads raise nearby value (accessibility)
  LV_COM_SRC: 16,         // commerce raises nearby value (amenity), scaled by density
  LV_RES_SRC: 3,
  LV_IND_SRC: 24,         // industry lowers nearby value (nuisance), scaled by density
  LV_WATER_SRC: 9,        // waterfront premium
  LV_BLUR_PASSES: 2,
  LV_INTERVAL: 2,         // recompute every N ticks (land value changes slowly)

  // --- Density caps by land value (0..1) ---
  MED_LV_REQ: 0.42,       // medium density requires this land value
  HIGH_LV_REQ: 0.66,      // high density requires this land value

  // --- Utilities (power & water) ---
  POWER_OUTPUT: 4000, POWER_COST: 3000,
  WATER_OUTPUT: 3000, WATER_COST: 1200,
  powerPer: [0, 1, 4, 12],  // power draw by density
  waterPer: [0, 1, 3, 8],   // water draw by density
  UTILITY_COOLDOWN: 6,      // min ticks between auto-built utilities

  // --- Autonomous road extension (grid-aligned) ---
  ROAD_BLOCK: 6,           // grid spacing: a road line every 6 tiles -> 5x5 blocks
  ROAD_PRESSURE_MIN: 0.10,
  ROAD_BUILD_BUDGET: 2.5,

  // --- Autonomous zoning ---
  ZONE_DEMAND_MIN: 0.05,
  ZONE_BUILD_BUDGET: 5,
  ZONE_DIST: 2,            // max Chebyshev distance from a road to zone/develop
  CLUSTER_BONUS: 0.6,
  SEP_RI: 0.4,

  // --- Building development & decline ---
  GROW_THRESHOLD: 0.05,
  DECLINE_THRESHOLD: -0.05,
  GROW_RATE: 14,
  DECLINE_RATE: 20,
  DEV_STEP_UP: 100,
  DEV_STEP_DOWN: 0,
  DEV_DEMAND_W: 0.7,       // growth-score weight on demand
  DEV_LV_W: 0.3,           // growth-score weight on land value

  // --- City services (police / fire / education) ---
  SERVICE_RADIUS: 12,      // coverage reach of one service building
  SERVICE_STRENGTH: 150,   // peak coverage per building (before funding scaling)
  SERVICE_COOLDOWN: 5,     // min ticks between auto-built services
  SERVICE_INTERVAL: 3,     // recompute coverage every N ticks
  COVERAGE_TARGET: 0.40,   // auto-build when avg coverage over population < this
  POLICE_COST: 1500, FIRE_COST: 1500, SCHOOL_COST: 2000,
  POLICE_MAINT: 40, FIRE_MAINT: 40, SCHOOL_MAINT: 55,
  LV_COVERAGE: 45,         // coverage's contribution to land value (at full coverage)
  R_SERVICE: 0.25,         // residential demand boost from service coverage

  // --- Approval ---
  APPROVAL_TAX_SLOPE: 180, // displeasure per unit of tax above comfort
  APPROVAL_UNEMP_PEN: 60,  // penalty per unit unemployment rate
  APPROVAL_DEFICIT_PEN: 25,// penalty while bankrupt
  APPROVAL_SERVICE_BONUS: 30, // bonus per unit of (coverage - 0.5)

  // --- Traffic / cars ---
  CARS_PER_CAPITA: 0.02,
  MIN_CARS: 12,
  MAX_CARS: 300,
  SPAWN_PER_TICK: 16,
  CAR_SPEED: 2.5,
  CAR_SPEED_VAR: 0.5,
  MAX_PATHS_PER_FRAME: 8,
  PATH_CACHE_SIZE: 256,

  // --- Traffic congestion ---
  CONGEST_ENTER: 22,        // congestion added to a cell when a car enters it
  CONGEST_DECAY: 14,        // congestion decay per real second
  PATH_CACHE_REFRESH: 40,   // clear the path cache every N ticks so routes adapt to jams
  LV_CONGEST_SRC: 30,       // busy roads reduce nearby land value
  APPROVAL_CONGEST_PEN: 25, // approval penalty per unit of average congestion
};
