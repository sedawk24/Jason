import { TILE_SIZE } from '../config/constants.js';
import { colorFor } from './tileSprites.js';

// Canvas orchestrator. Reads model state and draws it; never mutates the model.
// draw() takes what it needs as arguments so the renderer stays decoupled from
// the City object (Phase A passes only the grid; later phases add traffic/city).
export class Renderer {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.camera = camera;
    this.dpr = 1;
    this.cssW = 0;
    this.cssH = 0;
    this.lastDrawnTiles = 0;
    this.resize();
  }

  // Match the canvas backing store to its CSS size and the device pixel ratio.
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return; // layout not ready yet
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    this.cssW = rect.width;
    this.cssH = rect.height;
    this.camera.setViewport(rect.width, rect.height);
  }

  draw(grid /* , traffic, city */) {
    const ctx = this.ctx;
    const cam = this.camera;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Background (shows through where the map doesn't cover the viewport).
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, this.cssW, this.cssH);

    this.drawTiles(grid);
  }

  drawTiles(grid) {
    const ctx = this.ctx;
    const cam = this.camera;
    const b = cam.visibleTileBounds();
    const ts = TILE_SIZE * cam.zoom;
    const w = grid.width;

    let drawn = 0;
    for (let y = b.minY; y <= b.maxY; y++) {
      for (let x = b.minX; x <= b.maxX; x++) {
        const i = y * w + x;
        const s = cam.worldToScreen(x * TILE_SIZE, y * TILE_SIZE);
        ctx.fillStyle = colorFor(grid.type[i], grid.density[i]);
        // +1 px overdraw hides sub-pixel seams between adjacent tiles.
        ctx.fillRect(s.x, s.y, ts + 1, ts + 1);
        drawn++;
      }
    }
    this.lastDrawnTiles = drawn;

    // Subtle grid lines only when zoomed in enough to be useful.
    if (ts >= 12) {
      ctx.strokeStyle = 'rgba(0,0,0,0.10)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = b.minX; x <= b.maxX + 1; x++) {
        const a = cam.worldToScreen(x * TILE_SIZE, b.minY * TILE_SIZE);
        const c = cam.worldToScreen(x * TILE_SIZE, (b.maxY + 1) * TILE_SIZE);
        ctx.moveTo(Math.round(a.x) + 0.5, a.y);
        ctx.lineTo(Math.round(c.x) + 0.5, c.y);
      }
      for (let y = b.minY; y <= b.maxY + 1; y++) {
        const a = cam.worldToScreen(b.minX * TILE_SIZE, y * TILE_SIZE);
        const c = cam.worldToScreen((b.maxX + 1) * TILE_SIZE, y * TILE_SIZE);
        ctx.moveTo(a.x, Math.round(a.y) + 0.5);
        ctx.lineTo(c.x, Math.round(c.y) + 0.5);
      }
      ctx.stroke();
    }
  }
}
