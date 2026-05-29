// Simulation regression tests. Run with:  node tests/sim.test.mjs
// Pure model/sim layer is DOM-free; we shim localStorage so save/load works.
import { City } from '../src/model/City.js';
import { tick, rehydrate } from '../src/sim/simulate.js';
import { computeStats } from '../src/sim/stats.js';
import { TrafficSystem } from '../src/traffic/TrafficSystem.js';
import { TileType } from '../src/config/constants.js';

globalThis.localStorage = {
  _m: new Map(),
  getItem(k) { return this._m.has(k) ? this._m.get(k) : null; },
  setItem(k, v) { this._m.set(k, String(v)); },
  removeItem(k) { this._m.delete(k); },
};
const saveLoad = await import('../src/persistence/saveLoad.js');

let fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fail++; };
const gridDiff = (a, b) => {
  let d = 0;
  for (let i = 0; i < a.grid.size; i++) {
    if (a.grid.type[i] !== b.grid.type[i]) d++;
    if (a.grid.density[i] !== b.grid.density[i]) d++;
  }
  return d;
};
const roadCount = (c) => { let n = 0; for (let i = 0; i < c.grid.size; i++) if (c.grid.type[i] === TileType.ROAD) n++; return n; };
const maxLV = (c) => { let m = 0; for (let i = 0; i < c.grid.size; i++) if (c.grid.landValue[i] > m) m = c.grid.landValue[i]; return m; };

// --- 1. Save/load continuation determinism (save at an interval-aligned tick) ---
{
  const A = City.createNew(12345); computeStats(A);
  for (let t = 0; t < 300; t++) tick(A);
  saveLoad.save(A);
  const B = new City(); saveLoad.load(B); rehydrate(B);
  for (let t = 0; t < 100; t++) { tick(A); tick(B); }
  const same = gridDiff(A, B) === 0 &&
    A.stats.population === B.stats.population &&
    A.economy.treasury === B.economy.treasury &&
    A.demand.R === B.demand.R && A.demand.C === B.demand.C && A.demand.I === B.demand.I;
  ok(same, `continuation determinism after load (pop ${A.stats.population} vs ${B.stats.population}, gridDiff ${gridDiff(A, B)})`);
}

// --- 2. Load rehydration: derived fields correct immediately (no ticks run) ---
{
  const A = City.createNew(7); computeStats(A);
  for (let t = 0; t < 300; t++) tick(A);
  saveLoad.save(A);
  const B = new City(); saveLoad.load(B); rehydrate(B);
  // Derived fields must be populated immediately (the reviewer's bug was blank
  // land value / coverage / utility counts after load). Plant count is grid-
  // derived so it matches exactly; land value / coverage are recomputed fresh.
  const okHydrate = B.stats.powerPlants === A.stats.powerPlants &&
    B.stats.powerPlants > 0 &&
    B.stats.coverage01 > 0 &&
    B.stats.avgLandValue01 > 0 &&
    maxLV(B) > 0;
  ok(okHydrate, `load rehydrates derived fields (plants ${B.stats.powerPlants}/${A.stats.powerPlants}, cov ${B.stats.coverage01.toFixed(3)}, lvMax ${maxLV(B)})`);
}

// --- 3. Traffic RNG isolation: advancing traffic must not consume sim RNG ---
{
  const C1 = City.createNew(99); computeStats(C1); for (let t = 0; t < 200; t++) tick(C1);
  const C2 = City.createNew(99); computeStats(C2); for (let t = 0; t < 200; t++) tick(C2);
  const traffic = new TrafficSystem(C2);
  traffic.onTick(C2);
  for (let f = 0; f < 600; f++) traffic.advance(1 / 60); // 10s of car motion
  const n1 = C1.rng();
  const n2 = C2.rng();
  ok(n1 === n2, `sim RNG unaffected by traffic (${n1.toFixed(6)} === ${n2.toFixed(6)})`);
}

// --- 4. Zero utilities: no new occupancy; city declines ---
{
  const D = City.createNew(2024); computeStats(D);
  for (let t = 0; t < 250; t++) tick(D);
  const pop0 = D.stats.population;
  D.params.budgetUtil = 0;
  for (let t = 0; t < 250; t++) tick(D);
  ok(D.stats.population < pop0, `zero utilities -> decline (${pop0} -> ${D.stats.population})`);
}

// --- 5. Road budget: expansion halts at 0% ---
{
  const E = City.createNew(31); computeStats(E);
  for (let t = 0; t < 250; t++) tick(E);
  const roads0 = roadCount(E);
  E.params.budgetRoads = 0;
  for (let t = 0; t < 250; t++) tick(E);
  ok(roadCount(E) === roads0, `roads budget 0 halts expansion (${roads0} -> ${roadCount(E)})`);
}

// --- 6. Service coverage is population-weighted, not tile-weighted ---
{
  const F = new City(99);
  F.grid.clear();
  const g = F.grid;
  const dense = g.idx(40, 40);   // high-density, far from services -> uncovered
  const sparse = g.idx(80, 80);  // low-density, next to services -> covered
  g.type[dense] = TileType.RESIDENTIAL; g.density[dense] = 3;   // pop ~200
  g.type[sparse] = TileType.RESIDENTIAL; g.density[sparse] = 1; // pop ~12
  g.type[g.idx(79, 80)] = TileType.POLICE;
  g.type[g.idx(81, 80)] = TileType.FIRE;
  g.type[g.idx(80, 79)] = TileType.SCHOOL;
  computeStats(F);                 // per-tile population from density
  rehydrate(F);                    // recompute coverage etc. without auto-building
  // Tile-weighted would be ~0.5 (one covered, one not). Population-weighted is
  // dominated by the dense uncovered tile, so it should be small.
  ok(F.stats.coverage01 < 0.2, `coverage is population-weighted (coverage01 ${F.stats.coverage01.toFixed(3)} < 0.2)`);
}

// --- 7. No regression: city still grows and forms a density pyramid ---
{
  const G = City.createNew(12345); computeStats(G);
  for (let t = 0; t < 1500; t++) tick(G);
  const c = [0, 0, 0, 0];
  for (let i = 0; i < G.grid.size; i++) {
    const t = G.grid.type[i];
    if (t >= TileType.RESIDENTIAL && t <= TileType.INDUSTRIAL) c[G.grid.density[i]]++;
  }
  ok(G.stats.population > 1000 && c[1] > 0 && c[2] > 0 && c[3] > 0,
    `growth intact (pop ${G.stats.population}, density L/M/H ${c[1]}/${c[2]}/${c[3]})`);
}

console.log('\n' + (fail === 0 ? 'ALL PASS' : fail + ' FAILURE(S)'));
process.exit(fail === 0 ? 0 : 1);
