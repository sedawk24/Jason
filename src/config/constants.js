// Global constants and enums shared across the model, simulation, and presentation layers.

// --- Map dimensions ---
export const WIDTH = 128;
export const HEIGHT = 128;
export const TILE_SIZE = 16; // world pixels per tile at zoom = 1

// --- Tile types ---
// Ordered so that everything >= RESIDENTIAL is a "building" (occupies a developed cell).
export const TileType = Object.freeze({
  LAND: 0,
  WATER: 1,
  ROAD: 2,
  RESIDENTIAL: 3,
  COMMERCIAL: 4,
  INDUSTRIAL: 5,
  POWER_PLANT: 6,
  WATER_TOWER: 7,
  POLICE: 8,
  FIRE: 9,
  SCHOOL: 10,
});

// --- Building density levels ---
export const Density = Object.freeze({ EMPTY: 0, LOW: 1, MED: 2, HIGH: 3 });

// --- Per-tile bit flags (stored in grid.flags) ---
export const FLAG = Object.freeze({
  POWERED: 1,
  WATERED: 2,
});

// --- Time ---
export const TICK_DAYS = 7;      // one simulation tick = one in-game week
export const START_YEAR = 1900;  // epoch for the in-game date readout

// Simulation speed expressed as ticks per real second.
export const SIM_SPEEDS = Object.freeze({
  paused: 0,
  slow: 0.5,
  normal: 2,
  fast: 8,
});

// Cap on how many ticks a single animation frame may advance, so that
// backgrounding the tab (which pauses requestAnimationFrame) does not cause
// the city to fast-forward when the tab regains focus.
export const MAX_TICKS_PER_FRAME = 5;

// --- Tile-type predicates ---
export const isZone = (t) => t === TileType.RESIDENTIAL || t === TileType.COMMERCIAL || t === TileType.INDUSTRIAL;
export const isUtility = (t) => t === TileType.POWER_PLANT || t === TileType.WATER_TOWER;
export const isService = (t) => t === TileType.POLICE || t === TileType.FIRE || t === TileType.SCHOOL;
export const isBuilding = (t) => t >= TileType.RESIDENTIAL; // any developed cell (zone, utility, or service)
