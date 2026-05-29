import { Grid } from './Grid.js';
import { mulberry32 } from './rng.js';
import { TileType, Density } from '../config/constants.js';
import { B } from '../config/balance.js';

// The City is the single source of truth for a save: grid, time, policy params,
// demand, economy, and stats. It is pure model state -- no DOM, no canvas, no
// wall-clock. The simulation advances it one integer tick at a time.
export class City {
  constructor(seed = 12345) {
    this.seed = seed;
    this.rng = mulberry32(seed);
    this.tick = 0;
    this.grid = new Grid();

    // Policy parameters the player controls (the only thing the UI writes).
    this.params = {
      taxR: 0.09, taxC: 0.09, taxI: 0.09,
      budgetRoads: 1, budgetPower: 1,
      budgetPolice: 1, budgetFire: 1, budgetEdu: 1,
    };

    // RCI demand, EMA-smoothed, each in [-1, 1].
    this.demand = { R: 0, C: 0, I: 0 };

    this.economy = {
      treasury: B.START_TREASURY,
      lastIncome: 0,
      lastExpenses: 0,
      history: [],
    };

    this.stats = {
      population: 0, jobsC: 0, jobsI: 0,
      roadTiles: 0, powerPlants: 0, waterTowers: 0,
      powerCap: 0, powerDraw: 0, waterCap: 0, waterDraw: 0,
      coverage01: 0, avgLandValue01: 0, avgCongestion01: 0,
      approval: 100, unemployment: 0, bankrupt: false,
      industrialOutput: 0, goodsConsumed: 0,
    };

    // Engine bookkeeping (rebuilt from the grid on load; not the save's truth).
    this.roadFrontier = new Set();
    this.roadGraphDirty = true;
  }

  static createNew(seed = 12345) {
    const city = new City(seed);
    city.grid.generate(city.rng);
    city.seedSettlement();
    return city;
  }

  // Lay a tiny starting town: a tic-tac-toe road grid plus a handful of
  // low-density buildings. This guarantees the autonomous engine (Phase C+) a
  // seed road frontier to grow from, and gives cars endpoints to travel between.
  seedSettlement() {
    const g = this.grid;
    const cx = (g.width / 2) | 0;
    const cy = (g.height / 2) | 0;
    const span = 6;
    const rows = [cy - span, cy, cy + span];
    const cols = [cx - span, cx, cx + span];

    for (const ry of rows) {
      for (let x = cx - span; x <= cx + span; x++) this.setRoad(x, ry);
    }
    for (const cxx of cols) {
      for (let y = cy - span; y <= cy + span; y++) this.setRoad(cxx, y);
    }

    // Seed buildings: interior block tiles that are adjacent to a road.
    const seeds = [
      [cx - 5, cy - 5, TileType.RESIDENTIAL],
      [cx - 1, cy - 5, TileType.COMMERCIAL],
      [cx - 5, cy - 1, TileType.RESIDENTIAL],
      [cx - 1, cy - 1, TileType.RESIDENTIAL],
      [cx + 1, cy + 1, TileType.INDUSTRIAL],
      [cx + 5, cy + 5, TileType.RESIDENTIAL],
      [cx + 1, cy + 5, TileType.COMMERCIAL],
      [cx + 5, cy + 1, TileType.RESIDENTIAL],
    ];
    for (const [x, y, type] of seeds) this.setBuilding(x, y, type, Density.LOW);

    this.refreshRoadFrontier();
  }

  setRoad(x, y) {
    const g = this.grid;
    if (!g.inBounds(x, y)) return;
    const i = g.idx(x, y);
    if (g.type[i] === TileType.WATER) return;
    g.type[i] = TileType.ROAD;
    g.density[i] = 0;
  }

  setBuilding(x, y, type, density) {
    const g = this.grid;
    if (!g.inBounds(x, y)) return;
    const i = g.idx(x, y);
    if (g.type[i] !== TileType.LAND) return; // only develop empty land
    g.type[i] = type;
    g.density[i] = density;
  }

  // Road tiles that have at least one buildable (LAND) orthogonal neighbor --
  // the candidate set for autonomous road extension and zoning.
  refreshRoadFrontier() {
    const g = this.grid;
    this.roadFrontier.clear();
    for (let i = 0; i < g.size; i++) {
      if (g.type[i] !== TileType.ROAD) continue;
      const x = g.xOf(i), y = g.yOf(i);
      let open = false;
      g.forEachVonNeumann(x, y, (nx, ny, ni) => {
        if (g.type[ni] === TileType.LAND) open = true;
      });
      if (open) this.roadFrontier.add(i);
    }
  }
}
