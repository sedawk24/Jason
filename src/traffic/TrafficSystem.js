import { Car } from './Car.js';
import { PathFinder } from './pathfind.js';
import { B } from '../config/balance.js';
import { TileType } from '../config/constants.js';
import { CAR_COLORS } from '../render/tileSprites.js';

// Owns all car agents. Cars are visual in v1 (Phase F adds congestion coupling).
// Car state lives here, separate from the saved City model. Two clocks drive it:
//   onTick(city)  -- per simulation tick: reconcile fleet size, (re)spawn
//   advance(dt)   -- per render frame in REAL time: move cars, re-task arrivals
export class TrafficSystem {
  constructor(city) {
    this.city = city;
    this.cars = [];
    this.pool = [];
    this.endpoints = [];   // road tiles adjacent to a building (trip start/end)
    this.roadTiles = [];   // all road tiles (fallback when few endpoints)
    this.pathfinder = new PathFinder(city.grid);
    this.targetFleet = B.MIN_CARS;
    this.congestion = new Float32Array(city.grid.size); // real-time congestion intensity
    this.rebuildEndpoints();
  }

  // Clear all cars and rebuild endpoints (used after load/new-city).
  reset() {
    this.cars.length = 0;
    this.pool.length = 0;
    this.pathfinder.clearCache();
    this.targetFleet = B.MIN_CARS;
    this.congestion.fill(0);
    this.city.grid.traffic.fill(0);
    this.rebuildEndpoints();
  }

  // Recompute spawn endpoints from the current grid. Called when roads change.
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
    if (city.roadGraphDirty) {
      this.rebuildEndpoints();
      city.roadGraphDirty = false;
    }
    // Periodically clear the path cache so cars reroute around current congestion.
    if (city.tick % B.PATH_CACHE_REFRESH === 0) this.pathfinder.clearCache();

    const target = Math.round(city.stats.population * B.CARS_PER_CAPITA);
    this.targetFleet = Math.max(B.MIN_CARS, Math.min(B.MAX_CARS, target));

    // Spawn toward the target, bounded per tick.
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

  // Find a route from `src` to a random different endpoint, retrying a few times
  // so a same-src/dst pick or a momentarily unreachable target doesn't fail.
  tripFrom(src, tries = 4) {
    for (let t = 0; t < tries; t++) {
      const dst = this.randomEndpoint();
      if (dst == null || dst === src) continue;
      const path = this.pathfinder.find(src, dst);
      if (path && path.length >= 2) return path;
    }
    return null;
  }

  // Move cars in real time; when a car arrives, re-task it with a fresh trip or
  // retire it back to the pool if the fleet is over target.
  advance(dt) {
    const cong = this.congestion;

    // Decay congestion everywhere in real time, so it stays bounded at any sim
    // speed (and keeps draining while paused).
    const decay = B.CONGEST_DECAY * dt;
    if (decay > 0) {
      for (let i = 0; i < cong.length; i++) {
        const v = cong[i];
        if (v > 0) cong[i] = v > decay ? v - decay : 0;
      }
    }

    let pathBudget = B.MAX_PATHS_PER_FRAME;
    const cars = this.cars;
    for (let k = cars.length - 1; k >= 0; k--) {
      const car = cars[k];
      car.progress += car.speed * dt;

      // Credit the cell the car occupies with congestion, once per cell entered.
      const path = car.path;
      if (path) {
        const cell = path[Math.min(Math.floor(car.progress), path.length - 1)];
        if (cell !== car.lastCell) {
          const v = cong[cell] + B.CONGEST_ENTER;
          cong[cell] = v > 255 ? 255 : v;
          car.lastCell = cell;
        }
      }

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

    // Publish congestion to the grid (Uint8) for routing, land value, and overlay.
    const tr = this.city.grid.traffic;
    for (let i = 0; i < cong.length; i++) tr[i] = cong[i];
  }

  randomEndpoint() {
    const list = this.endpoints.length >= 2 ? this.endpoints : this.roadTiles;
    if (list.length === 0) return null;
    return list[(this.city.rng() * list.length) | 0];
  }

  randomSpeed() {
    const v = 1 + (this.city.rng() * 2 - 1) * B.CAR_SPEED_VAR;
    return B.CAR_SPEED * v;
  }

  randomColor() {
    return CAR_COLORS[(this.city.rng() * CAR_COLORS.length) | 0];
  }
}
