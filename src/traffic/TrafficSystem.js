import { Car } from './Car.js';
import { PathFinder } from './pathfind.js';
import { mulberry32 } from '../model/rng.js';
import { B } from '../config/balance.js';
import { TileType } from '../config/constants.js';
import { CAR_COLORS } from '../render/tileSprites.js';

// Owns all car agents -- a PURELY VISUAL layer. Cars read the road grid to
// pathfind and animate, but never mutate the model and use their OWN random
// stream (not the simulation RNG), so frame-time car behavior cannot affect
// simulation determinism. (Congestion that feeds the simulation is computed
// deterministically in the tick pipeline; see sim/congestion.js.)
export class TrafficSystem {
  constructor(city) {
    this.city = city;
    this.cars = [];
    this.pool = [];
    this.endpoints = [];   // road tiles adjacent to a building (trip start/end)
    this.roadTiles = [];   // all road tiles (fallback when few endpoints)
    this.pathfinder = new PathFinder(city.grid);
    this.rng = mulberry32((city.seed ^ 0x9e3779b9) >>> 0); // separate from sim RNG
    this.targetFleet = B.MIN_CARS;
    this.rebuildEndpoints();
  }

  // Clear all cars and rebuild endpoints (used after load/new-city).
  reset() {
    this.cars.length = 0;
    this.pool.length = 0;
    this.pathfinder.clearCache();
    this.targetFleet = B.MIN_CARS;
    this.rng = mulberry32((this.city.seed ^ 0x9e3779b9) >>> 0);
    this.rebuildEndpoints();
  }

  // Recompute spawn endpoints from the current grid.
  rebuildEndpoints() {
    const g = this.city.grid;
    this.endpoints.length = 0;
    this.roadTiles.length = 0;
    for (let i = 0; i < g.size; i++) {
      if (g.type[i] !== TileType.ROAD) continue;
      this.roadTiles.push(i);
      const x = g.xOf(i), y = g.yOf(i);
      let adjBuilding = false;
      g.forEachVonNeumann(x, y, (nx, ny, ni) => {
        if (g.type[ni] >= TileType.RESIDENTIAL) adjBuilding = true;
      });
      if (adjBuilding) this.endpoints.push(i);
    }
    this.pathfinder.clearCache();
  }

  onTick(city) {
    // Rebuild endpoints when roads change, and periodically otherwise (zoning,
    // development, utilities, and services also change which roads border
    // buildings without setting roadGraphDirty).
    if (city.roadGraphDirty) {
      this.rebuildEndpoints();
      city.roadGraphDirty = false;
    } else if (city.tick % B.ENDPOINT_REBUILD === 0) {
      this.rebuildEndpoints();
    }
    // Periodically clear the path cache so cars reroute around current congestion.
    if (city.tick % B.PATH_CACHE_REFRESH === 0) this.pathfinder.clearCache();

    const target = Math.round(city.stats.population * B.CARS_PER_CAPITA);
    this.targetFleet = Math.max(B.MIN_CARS, Math.min(B.MAX_CARS, target));

    let attempts = 0;
    while (this.cars.length < this.targetFleet && attempts < B.SPAWN_PER_TICK) {
      attempts++;
      this.spawnCar();
    }
  }

  spawnCar() {
    const src = this.randomEndpoint();
    if (src == null) return false;
    const path = this.tripFrom(src);
    if (!path) return false;
    const car = this.pool.pop() || new Car();
    car.reset(path, this.randomSpeed(), this.randomColor());
    this.cars.push(car);
    return true;
  }

  // Find a route from `src` to a random different endpoint, retrying a few times.
  tripFrom(src, tries = 4) {
    for (let t = 0; t < tries; t++) {
      const dst = this.randomEndpoint();
      if (dst == null || dst === src) continue;
      const path = this.pathfinder.find(src, dst);
      if (path && path.length >= 2) return path;
    }
    return null;
  }

  // Move cars in real time; re-task on arrival or retire if over target. Reads
  // only the grid (via pathfinding) -- never writes to the model.
  advance(dt) {
    let pathBudget = B.MAX_PATHS_PER_FRAME;
    const cars = this.cars;
    for (let k = cars.length - 1; k >= 0; k--) {
      const car = cars[k];
      car.progress += car.speed * dt;
      if (!car.arrived) continue;

      let newPath = null;
      if (cars.length <= this.targetFleet && pathBudget > 0) {
        newPath = this.tripFrom(car.path[car.path.length - 1], 3);
        pathBudget--;
      }
      if (newPath && newPath.length >= 2) {
        car.reset(newPath, this.randomSpeed(), car.color);
      } else {
        cars.splice(k, 1);
        car.path = null;
        this.pool.push(car);
      }
    }
  }

  randomEndpoint() {
    const list = this.endpoints.length >= 2 ? this.endpoints : this.roadTiles;
    if (list.length === 0) return null;
    return list[(this.rng() * list.length) | 0];
  }

  randomSpeed() {
    const v = 1 + (this.rng() * 2 - 1) * B.CAR_SPEED_VAR;
    return B.CAR_SPEED * v;
  }

  randomColor() {
    return CAR_COLORS[(this.rng() * CAR_COLORS.length) | 0];
  }
}
