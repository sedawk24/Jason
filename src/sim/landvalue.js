import { B } from '../config/balance.js';
import { TileType, WIDTH, HEIGHT } from '../config/constants.js';

// Land value field (0..255). Drivers: a smooth downtown premium (peaks at the
// city center), accessibility from roads, commercial amenity, waterfront, minus
// industrial nuisance -- all spread by a few blur passes. Land value caps building
// density (high-rises only downtown) and feeds the development growth score.
//
// Recomputed every LV_INTERVAL ticks; it changes slowly. Scratch buffers and the
// static center premium are allocated once and reused.

const OX = (WIDTH / 2) | 0;
const OY = (HEIGHT / 2) | 0;
const MAXD = Math.hypot(OX, OY);

let srcA = null, srcB = null, centerField = null;

export function diffuseLandValue(city) {
  if (city.tick > 1 && city.tick % B.LV_INTERVAL !== 0) return;

  const g = city.grid, n = g.size, w = g.width, h = g.height;
  if (!srcA || srcA.length !== n) {
    srcA = new Float32Array(n);
    srcB = new Float32Array(n);
    centerField = buildCenterField(n, w, h);
  }

  for (let i = 0; i < n; i++) {
    const t = g.type[i];
    let s = 0;
    if (t === TileType.ROAD) s = B.LV_ROAD_SRC - B.LV_CONGEST_SRC * (g.traffic[i] / 255);
    else if (t === TileType.COMMERCIAL) s = B.LV_COM_SRC * (1 + g.density[i]);
    else if (t === TileType.RESIDENTIAL) s = B.LV_RES_SRC;
    else if (t === TileType.INDUSTRIAL) s = -B.LV_IND_SRC * (1 + g.density[i]);
    else if (t === TileType.WATER) s = B.LV_WATER_SRC;
    srcA[i] = s;
  }

  let a = srcA, b = srcB;
  for (let p = 0; p < B.LV_BLUR_PASSES; p++) {
    blur(a, b, w, h);
    const t = a; a = b; b = t;
  }

  for (let i = 0; i < n; i++) {
    const v = B.LV_BASE + a[i] + centerField[i] + B.LV_COVERAGE * (g.coverage[i] / 255);
    g.landValue[i] = v < 0 ? 0 : v > 255 ? 255 : v;
  }
}

function buildCenterField(n, w, h) {
  const f = new Float32Array(n);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      f[y * w + x] = B.LV_CENTER * (1 - Math.min(1, Math.hypot(x - OX, y - OY) / MAXD));
    }
  }
  return f;
}

function blur(a, b, w, h) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, cnt = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          sum += a[ny * w + nx];
          cnt++;
        }
      }
      b[y * w + x] = sum / cnt;
    }
  }
}
