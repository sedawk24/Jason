import { WIDTH, HEIGHT, TileType } from '../config/constants.js';

// The tile map, stored as Structure-of-Arrays typed arrays (one array per
// attribute, indexed by y * width + x). Typed arrays are fast, cache-friendly,
// GC-light, and trivially serializable to base64 for saves.
export class Grid {
  constructor(width = WIDTH, height = HEIGHT) {
    this.width = width;
    this.height = height;
    const n = width * height;
    this.size = n;

    this.type = new Uint8Array(n);       // TileType
    this.density = new Uint8Array(n);    // Density (0 empty .. 3 high)
    this.devLevel = new Uint8Array(n);   // 0..255 progress toward next density step (hysteresis)
    this.landValue = new Uint8Array(n);  // 0..255 desirability
    this.population = new Uint16Array(n);// residents on residential tiles
    this.jobs = new Uint16Array(n);      // jobs on commercial/industrial tiles
    this.flags = new Uint8Array(n);      // FLAG bitfield
    this.coverage = new Uint8Array(n);   // 0..255 combined service coverage
    this.traffic = new Uint8Array(n);    // 0..255 congestion
  }

  idx(x, y) { return y * this.width + x; }
  xOf(i) { return i % this.width; }
  yOf(i) { return (i / this.width) | 0; }
  inBounds(x, y) { return x >= 0 && y >= 0 && x < this.width && y < this.height; }

  // 4-neighborhood. Calls fn(nx, ny, nIdx) for each in-bounds orthogonal neighbor.
  // Uses a callback (rather than returning an array) to avoid per-call allocation
  // in hot simulation loops.
  forEachVonNeumann(x, y, fn) {
    const w = this.width;
    if (y > 0) fn(x, y - 1, (y - 1) * w + x);
    if (x > 0) fn(x - 1, y, y * w + x - 1);
    if (x < w - 1) fn(x + 1, y, y * w + x + 1);
    if (y < this.height - 1) fn(x, y + 1, (y + 1) * w + x);
  }

  // 8-neighborhood, used for diffusion passes.
  forEachMoore(x, y, fn) {
    const w = this.width, h = this.height;
    for (let dy = -1; dy <= 1; dy++) {
      const ny = y + dy;
      if (ny < 0 || ny >= h) continue;
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        if (nx < 0 || nx >= w) continue;
        fn(nx, ny, ny * w + nx);
      }
    }
  }

  // Generate bare land with an organic water body. Deterministic given rng.
  generate(rng) {
    this.type.fill(TileType.LAND);

    const w = this.width, h = this.height;
    const noise = valueNoise(rng, w, h, 18);
    const cx = w / 2, cy = h / 2;
    const clearR2 = 14 * 14; // keep a clear land disk at the center for the seed settlement

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (noise[i] < 0.30) {
          const dx = x - cx, dy = y - cy;
          if (dx * dx + dy * dy > clearR2) {
            this.type[i] = TileType.WATER;
          }
        }
      }
    }
  }
}

// Smooth value noise in [0,1]: a coarse grid of random values, smoothstep-
// interpolated. Used to carve natural-looking water bodies.
function valueNoise(rng, width, height, scale) {
  const gw = Math.ceil(width / scale) + 2;
  const gh = Math.ceil(height / scale) + 2;
  const g = new Float32Array(gw * gh);
  for (let i = 0; i < g.length; i++) g[i] = rng();

  const out = new Float32Array(width * height);
  const smooth = (t) => t * t * (3 - 2 * t);

  for (let y = 0; y < height; y++) {
    const gy = y / scale;
    const y0 = Math.floor(gy);
    const fy = smooth(gy - y0);
    for (let x = 0; x < width; x++) {
      const gx = x / scale;
      const x0 = Math.floor(gx);
      const fx = smooth(gx - x0);
      const a = g[y0 * gw + x0];
      const b = g[y0 * gw + x0 + 1];
      const c = g[(y0 + 1) * gw + x0];
      const d = g[(y0 + 1) * gw + x0 + 1];
      const top = a + (b - a) * fx;
      const bot = c + (d - c) * fx;
      out[y * width + x] = top + (bot - top) * fy;
    }
  }
  return out;
}
