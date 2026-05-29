import { TILE_SIZE, TileType, FLAG } from '../config/constants.js';

// Data overlays drawn as a translucent heatmap over the tiles. Modes:
//   'landvalue' / 'coverage' -> blue(low)..red(high) heat of the field
//   'power'                  -> powered buildings green, unpowered red
export function drawOverlay(ctx, camera, grid, mode) {
  if (!mode || mode === 'none') return;

  const b = camera.visibleTileBounds();
  const ts = TILE_SIZE * camera.zoom;
  const w = grid.width;

  ctx.globalAlpha = 0.68;
  for (let y = b.minY; y <= b.maxY; y++) {
    for (let x = b.minX; x <= b.maxX; x++) {
      const i = y * w + x;
      let color = null;

      if (mode === 'landvalue') {
        color = heat(grid.landValue[i] / 255);
      } else if (mode === 'coverage') {
        color = heat(grid.coverage[i] / 255);
      } else if (mode === 'power') {
        const t = grid.type[i];
        if (t >= TileType.RESIDENTIAL && t <= TileType.INDUSTRIAL) {
          color = (grid.flags[i] & FLAG.POWERED) ? '#2ecc71' : '#e74c3c';
        }
      }
      if (!color) continue;

      const s = camera.worldToScreen(x * TILE_SIZE, y * TILE_SIZE);
      ctx.fillStyle = color;
      ctx.fillRect(s.x, s.y, ts + 1, ts + 1);
    }
  }
  ctx.globalAlpha = 1;
}

// Blue (low) -> green -> red (high).
function heat(t) {
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const r = Math.round(255 * t);
  const bl = Math.round(255 * (1 - t));
  const g = Math.round(70 + 90 * (1 - Math.abs(t - 0.5) * 2));
  return `rgb(${r},${g},${bl})`;
}
