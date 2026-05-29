// Save/load the city to localStorage. We persist the authored grid layers
// (type, density, devLevel) as base64, the scalar state, and the simulation RNG
// state (so continuation after load is deterministic). Derived fields (land
// value, coverage, congestion, utility flags, per-tile population/jobs) are
// recomputed by simulate.rehydrate() after load. Typed-array buffers go to
// base64, not per-tile JSON, to stay well under the localStorage size limit.
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
      rngState: city.rng.getState(),
      params: { ...city.params },
      demand: { ...city.demand },
      treasury: city.economy.treasury,
      history: city.economy.history.slice(-260),
      lastPowerBuild: city.lastPowerBuild,
      lastWaterBuild: city.lastWaterBuild,
      lastServiceBuild: city.lastServiceBuild,
      width: g.width,
      height: g.height,
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
// Validates the payload BEFORE touching live state, so a corrupt save can't leave
// the city half-mutated. Caller should run simulate.rehydrate(city) afterwards.
export function load(city) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (d.v !== 1) { console.warn('save: unsupported version', d.v); return false; }

    const g = city.grid;
    const type = b64ToU8(d.type);
    const density = b64ToU8(d.density);
    const devLevel = b64ToU8(d.devLevel);
    if (type.length !== g.size || density.length !== g.size || devLevel.length !== g.size) {
      console.warn('save: grid size mismatch');
      return false;
    }

    city.seed = d.seed;
    city.tick = d.tick;
    if (typeof d.rngState === 'number') city.rng.setState(d.rngState);
    Object.assign(city.params, d.params);
    Object.assign(city.demand, d.demand);
    city.economy.treasury = d.treasury;
    city.economy.history.length = 0;
    if (d.history) for (const h of d.history) city.economy.history.push(h);
    city.lastPowerBuild = d.lastPowerBuild ?? -999;
    city.lastWaterBuild = d.lastWaterBuild ?? -999;
    city.lastServiceBuild = d.lastServiceBuild ?? -999;

    g.clear();
    g.type.set(type);
    g.density.set(density);
    g.devLevel.set(devLevel);
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
