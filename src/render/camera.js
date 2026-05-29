import { TILE_SIZE, WIDTH, HEIGHT } from '../config/constants.js';

// Pan/zoom camera. Coordinates:
//   world pixels   = tile coordinate * TILE_SIZE
//   (camera.x, camera.y) is the world-pixel point shown at the viewport center.
export class Camera {
  constructor() {
    this.x = (WIDTH * TILE_SIZE) / 2;
    this.y = (HEIGHT * TILE_SIZE) / 2;
    this.zoom = 1;
    this.minZoom = 0.12;
    this.maxZoom = 5;
    this.viewW = 800;
    this.viewH = 400;
  }

  setViewport(w, h) {
    this.viewW = w;
    this.viewH = h;
  }

  worldToScreen(wx, wy) {
    return {
      x: (wx - this.x) * this.zoom + this.viewW / 2,
      y: (wy - this.y) * this.zoom + this.viewH / 2,
    };
  }

  screenToWorld(sx, sy) {
    return {
      x: (sx - this.viewW / 2) / this.zoom + this.x,
      y: (sy - this.viewH / 2) / this.zoom + this.y,
    };
  }

  // Pan by a screen-pixel delta (e.g. a mouse drag).
  panByScreen(dxScreen, dyScreen) {
    this.x -= dxScreen / this.zoom;
    this.y -= dyScreen / this.zoom;
    this.clamp();
  }

  // Zoom by `factor` while keeping the world point under (sx, sy) fixed.
  zoomAt(sx, sy, factor) {
    const before = this.screenToWorld(sx, sy);
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));
    const after = this.screenToWorld(sx, sy);
    this.x += before.x - after.x;
    this.y += before.y - after.y;
    this.clamp();
  }

  clamp() {
    const worldW = WIDTH * TILE_SIZE;
    const worldH = HEIGHT * TILE_SIZE;
    this.x = Math.max(0, Math.min(worldW, this.x));
    this.y = Math.max(0, Math.min(worldH, this.y));
  }

  // Inclusive tile bounds currently visible, clamped to the map. Used for culling.
  visibleTileBounds() {
    const tl = this.screenToWorld(0, 0);
    const br = this.screenToWorld(this.viewW, this.viewH);
    return {
      minX: Math.max(0, Math.floor(tl.x / TILE_SIZE)),
      minY: Math.max(0, Math.floor(tl.y / TILE_SIZE)),
      maxX: Math.min(WIDTH - 1, Math.ceil(br.x / TILE_SIZE)),
      maxY: Math.min(HEIGHT - 1, Math.ceil(br.y / TILE_SIZE)),
    };
  }

  // Pick a zoom that fits the whole map in the current viewport, with a margin.
  fitToView() {
    const zx = this.viewW / (WIDTH * TILE_SIZE);
    const zy = this.viewH / (HEIGHT * TILE_SIZE);
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, Math.min(zx, zy) * 0.95));
    this.x = (WIDTH * TILE_SIZE) / 2;
    this.y = (HEIGHT * TILE_SIZE) / 2;
  }
}
