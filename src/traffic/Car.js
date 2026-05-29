// A single car agent. It holds a road-cell path and a floating-point position
// along it; the renderer interpolates between cells for smooth motion. Cars are
// pooled and recycled, so reset() returns one to a clean state.
export class Car {
  constructor() {
    this.path = null;    // Int32Array of tile indices (road cells)
    this.progress = 0;   // float in [0, path.length - 1]
    this.speed = 0;      // tiles per real second
    this.color = '#fff';
    this.lastCell = -1;  // last road cell credited with congestion
  }

  reset(path, speed, color) {
    this.path = path;
    this.progress = 0;
    this.speed = speed;
    this.color = color;
    this.lastCell = -1;
  }

  get arrived() {
    return this.path === null || this.progress >= this.path.length - 1;
  }
}
