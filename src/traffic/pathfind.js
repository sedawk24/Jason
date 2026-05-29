import { B } from '../config/balance.js';
import { TileType } from '../config/constants.js';

// A* pathfinding over ROAD tiles, with an LRU cache. Cars travel road-to-road;
// pathfinding happens only on spawn/re-task (never per frame), and identical
// trips reuse cached paths. Reusable scratch buffers avoid per-search allocation.
export class PathFinder {
  constructor(grid) {
    this.grid = grid;
    this.cache = new Map(); // key -> Int32Array path (Map preserves insertion order for LRU)
    const n = grid.size;
    this.gScore = new Float32Array(n);
    this.came = new Int32Array(n);
    this.closed = new Uint8Array(n);
    this.heap = new MinHeap();
  }

  clearCache() {
    this.cache.clear();
  }

  find(src, dst) {
    if (src === dst) return null;
    const key = src * this.grid.size + dst;
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      this.cache.delete(key);
      this.cache.set(key, cached); // refresh LRU position
      return cached;
    }
    const path = this.astar(src, dst);
    if (path) {
      this.cache.set(key, path);
      if (this.cache.size > B.PATH_CACHE_SIZE) {
        const oldest = this.cache.keys().next().value;
        this.cache.delete(oldest);
      }
    }
    return path;
  }

  astar(src, dst) {
    const g = this.grid;
    const w = g.width, h = g.height;
    const type = g.type;
    const traffic = g.traffic; // congestion adds traversal cost (0 before Phase F)
    const gScore = this.gScore;
    const came = this.came;
    const closed = this.closed;
    const heap = this.heap;

    gScore.fill(Infinity);
    closed.fill(0);
    heap.clear();

    const dx = dst % w, dy = (dst / w) | 0;
    const heuristic = (i) => Math.abs((i % w) - dx) + Math.abs(((i / w) | 0) - dy);

    gScore[src] = 0;
    heap.push(src, heuristic(src));

    while (heap.size > 0) {
      const cur = heap.pop();
      if (cur === dst) return reconstruct(came, src, dst, g.size);
      if (closed[cur]) continue;
      closed[cur] = 1;

      const cx = cur % w, cy = (cur / w) | 0;
      const baseG = gScore[cur];

      // Orthogonal neighbors that are roads.
      if (cy > 0) relax(cur - w, baseG, gScore, came, closed, heap, type, traffic, heuristic, cur);
      if (cx > 0) relax(cur - 1, baseG, gScore, came, closed, heap, type, traffic, heuristic, cur);
      if (cx < w - 1) relax(cur + 1, baseG, gScore, came, closed, heap, type, traffic, heuristic, cur);
      if (cy < h - 1) relax(cur + w, baseG, gScore, came, closed, heap, type, traffic, heuristic, cur);
    }
    return null; // no route (disconnected road networks)
  }
}

function relax(nb, baseG, gScore, came, closed, heap, type, traffic, heuristic, from) {
  if (type[nb] !== TileType.ROAD || closed[nb]) return;
  const step = 1 + traffic[nb] / 64; // heavier congestion => costlier to traverse
  const tentative = baseG + step;
  if (tentative < gScore[nb]) {
    gScore[nb] = tentative;
    came[nb] = from;
    heap.push(nb, tentative + heuristic(nb));
  }
}

function reconstruct(came, src, dst, maxLen) {
  const tmp = [dst];
  let c = dst;
  while (c !== src) {
    c = came[c];
    tmp.push(c);
    if (tmp.length > maxLen) return null; // safety against a broken came-chain
  }
  tmp.reverse();
  return Int32Array.from(tmp);
}

// Binary min-heap over (node, priority) using parallel growable arrays. Numbers
// only -- no per-node object allocation. Supports the lazy-deletion A* pattern
// (push duplicates; skip already-closed nodes on pop).
class MinHeap {
  constructor() {
    this.n = [];
    this.p = [];
  }
  get size() { return this.n.length; }
  clear() { this.n.length = 0; this.p.length = 0; }
  push(node, prio) {
    const n = this.n, p = this.p;
    n.push(node); p.push(prio);
    let i = n.length - 1;
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (p[par] <= p[i]) break;
      swap(n, p, i, par);
      i = par;
    }
  }
  pop() {
    const n = this.n, p = this.p;
    const top = n[0];
    const last = n.length - 1;
    swap(n, p, 0, last);
    n.pop(); p.pop();
    const len = n.length;
    let i = 0;
    while (true) {
      const l = 2 * i + 1, r = 2 * i + 2;
      let s = i;
      if (l < len && p[l] < p[s]) s = l;
      if (r < len && p[r] < p[s]) s = r;
      if (s === i) break;
      swap(n, p, i, s);
      i = s;
    }
    return top;
  }
}

function swap(n, p, a, b) {
  const tn = n[a]; n[a] = n[b]; n[b] = tn;
  const tp = p[a]; p[a] = p[b]; p[b] = tp;
}
