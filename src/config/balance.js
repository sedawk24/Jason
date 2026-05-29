// ALL tunable simulation constants live here. Tune balance/economy here only --
// never hard-code these numbers inside logic. Grows phase by phase.
//
// (Phase B subset: economy seed + traffic. Phases C-F extend this object.)

export const B = {
  // --- Economy ---
  START_TREASURY: 20000,

  // --- Traffic / cars ---
  CARS_PER_CAPITA: 0.02,   // target fleet = population * this
  MIN_CARS: 12,            // floor so a small seed town still shows traffic
  MAX_CARS: 300,           // ceiling for performance
  SPAWN_PER_TICK: 16,      // max spawn attempts per simulation tick
  CAR_SPEED: 2.5,          // base speed in tiles per real second
  CAR_SPEED_VAR: 0.5,      // +/- fraction of random speed variation
  MAX_PATHS_PER_FRAME: 8,  // cap on re-task pathfinds per render frame
  PATH_CACHE_SIZE: 256,    // LRU path cache capacity
};
