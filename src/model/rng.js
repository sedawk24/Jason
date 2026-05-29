// Seedable pseudo-random number generator (mulberry32).
//
// Every stochastic choice in the simulation goes through one of these so that a
// given seed always produces the same city -- saves reload identically and bugs
// reproduce deterministically.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Integer in [min, max) -- inclusive of min, exclusive of max.
export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min));
}

// True with probability p.
export function chance(rng, p) {
  return rng() < p;
}

// A random element of a non-empty array.
export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}
