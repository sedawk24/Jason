// Save/load the city to localStorage. We persist the authored grid layers
// (type, density, devLevel) as base64 plus the scalar state; derived fields
// (land value, coverage, utility flags, per-tile population/jobs) are recomputed
// after load by the simulation. Typed-array buffers go to base64, not per-tile
// JSON, to stay well under the localStorage size limit (~150KB here).
const KEY = 'citysim.save.v1';

export function hasSave() {
  try { return localStorage.getItem(KEY) != null; } catch (e) { return false; }
}

export function save(city) {
  try {
    const g = city.grid;
    const data = {
      v: 1,
      seed: city.seed,
      tick: city.tick,
      params: { ...city.params },
      demand: { ...city.demand },
      treasury: city.economy.treasury,
      history: city.economy.history.slice(-260),
      lastPowerBuild: city.lastPowerBuild,
      lastWaterBuild: city.lastWaterBuild,
      lastServiceBuild: city.lastServiceBuild,
      type: u8ToB64(g.type),
      density: u8ToB64(g.density),
      devLevel: u8ToB64(g.devLevel),
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('save failed', e);
    return false;
  }
}

// Mutates `city` in place (so existing references -- traffic, UI -- stay valid).
export function load(city) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);

    city.seed = d.seed;
    city.tick = d.tick;
    Object.assign(city.params, d.params);
    Object.assign(city.demand, d.demand);
    city.economy.treasury = d.treasury;
    city.economy.history.length = 0;
    if (d.history) for (const h of d.history) city.economy.history.push(h);
    city.lastPowerBuild = d.lastPowerBuild ?? -999;
    city.lastWaterBuild = d.lastWaterBuild ?? -999;
    city.lastServiceBuild = d.lastServiceBuild ?? -999;

    const g = city.grid;
    g.clear();
    g.type.set(b64ToU8(d.type));
    g.density.set(b64ToU8(d.density));
    g.devLevel.set(b64ToU8(d.devLevel));

    city.refreshRoadFrontier();
    city.roadGraphDirty = true;
    return true;
  } catch (e) {
    console.warn('load failed', e);
    return false;
  }
}

function u8ToB64(u8) {
  let s = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < u8.length; i += CHUNK) {
    s += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK));
  }
  return btoa(s);
}

function b64ToU8(b64) {
  const s = atob(b64);
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
}
