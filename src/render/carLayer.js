import { TILE_SIZE } from '../config/constants.js';

// Draw cars at their interpolated positions. Called every render frame; reads
// car state (which advances in real time) so motion is smooth at any sim speed.
export function drawCars(ctx, camera, grid, traffic) {
  const ts = TILE_SIZE * camera.zoom;
  if (ts < 2) return; // too zoomed out for cars to be legible
  const size = Math.max(2, ts * 0.34);
  const half = size / 2;
  const w = grid.width;

  for (const car of traffic.cars) {
    const path = car.path;
    if (!path || path.length < 2) continue;

    const i = Math.floor(car.progress);
    const f = car.progress - i;
    const a = path[Math.min(i, path.length - 1)];
    const b = path[Math.min(i + 1, path.length - 1)];
    const ax = a % w, ay = (a / w) | 0;
    const bx = b % w, by = (b / w) | 0;

    // Interpolate in tile space, offset to the tile center.
    const tx = ax + (bx - ax) * f + 0.5;
    const ty = ay + (by - ay) * f + 0.5;
    const s = camera.worldToScreen(tx * TILE_SIZE, ty * TILE_SIZE);

    ctx.fillStyle = car.color;
    ctx.fillRect(s.x - half, s.y - half, size, size);
  }
}
