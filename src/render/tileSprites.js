import { TileType } from '../config/constants.js';

// Color lookup per tile type (and density for zones). Procedural flat colors in
// v1 -- the full palette is defined now so later phases need no renderer changes.

// Zone colors indexed by density: [empty(pale), low, med, high(darkest)].
const ZONE_COLORS = {
  [TileType.RESIDENTIAL]: ['#cfe6c2', '#86cf6f', '#4ba84a', '#2e7d32'],
  [TileType.COMMERCIAL]: ['#cfe6fa', '#67bdf2', '#2491e0', '#15569f'],
  [TileType.INDUSTRIAL]: ['#ece1b6', '#e6c64f', '#cf9d1c', '#9c7209'],
};

// Flat colors for non-zone tiles.
const FLAT = {
  [TileType.LAND]: '#8aa872',
  [TileType.WATER]: '#3d6fa3',
  [TileType.ROAD]: '#3e424b',
  [TileType.POWER_PLANT]: '#5d4037',
  [TileType.WATER_TOWER]: '#2aa6bf',
  [TileType.POLICE]: '#3949ab',
  [TileType.FIRE]: '#d84343',
  [TileType.SCHOOL]: '#8e44ad',
};

export function colorFor(type, density = 0) {
  const zone = ZONE_COLORS[type];
  if (zone) return zone[density] || zone[0];
  return FLAT[type] || '#ff00ff'; // magenta = unhandled type (should never show)
}

// Car colors by trip type. A car on a congested road overrides to `congested`
// (red) and also slows down -- see traffic/TrafficSystem and render/carLayer.
export const CAR_COLORS = {
  toWork: '#4cc9f0',    // home -> work (commuting out)
  toHome: '#b5e853',    // work -> home (commuting back)
  other: '#f4a261',     // other / business trip
  congested: '#ef3b4e', // on a congested road (overrides the trip color)
};
