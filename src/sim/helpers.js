import { TileType } from '../config/constants.js';

// Fisher-Yates shuffle in place using the city's seeded RNG (deterministic).
export function shuffleInPlace(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
}

// Does tile i have at least one orthogonally-adjacent road?
export function isRoadAdjacent(grid, i) {
  const x = grid.xOf(i), y = grid.yOf(i);
  let adj = false;
  grid.forEachVonNeumann(x, y, (nx, ny, ni) => {
    if (grid.type[ni] === TileType.ROAD) adj = true;
  });
  return adj;
}

// Is tile i within Chebyshev distance `dist` of a road? Lets buildings develop a
// few tiles deep into a block, so blocks fill in rather than leaving interiors
// of the road grid as empty land.
export function nearRoad(grid, i, dist) {
  const x = grid.xOf(i), y = grid.yOf(i);
  const w = grid.width, h = grid.height;
  for (let dy = -dist; dy <= dist; dy++) {
    const ny = y + dy;
    if (ny < 0 || ny >= h) continue;
    for (let dx = -dist; dx <= dist; dx++) {
      const nx = x + dx;
      if (nx < 0 || nx >= w) continue;
      if (grid.type[ny * w + nx] === TileType.ROAD) return true;
    }
  }
  return false;
}

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
