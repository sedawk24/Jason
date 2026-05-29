import { City } from './model/City.js';
import { Camera } from './render/camera.js';
import { Renderer } from './render/Renderer.js';
import { TrafficSystem } from './traffic/TrafficSystem.js';
import { TimeControls } from './ui/TimeControls.js';
import { tick as simTick } from './sim/simulate.js';
import { computeStats } from './sim/stats.js';
import { StatBars } from './ui/StatBars.js';
import { SIM_SPEEDS, MAX_TICKS_PER_FRAME, TILE_SIZE } from './config/constants.js';

// --- Construct the world ---
const canvas = document.getElementById('cityCanvas');
const camera = new Camera();
const renderer = new Renderer(canvas, camera);

const city = City.createNew(12345);
computeStats(city); // initial stats so demand and fleet sizing see the seed town

// Optional fast-forward for screenshots/debugging: ?ticks=N runs N sim ticks now.
const ffTicks = Math.min(20000, Math.max(0, parseInt(new URLSearchParams(location.search).get('ticks') || '0', 10)));
for (let t = 0; t < ffTicks; t++) simTick(city);

const traffic = new TrafficSystem(city);
traffic.onTick(city); // warm-start the initial fleet so cars appear immediately

// Simulation speed in ticks per real second (mutated by the time controls).
let speed = SIM_SPEEDS.normal;
const timeControls = new TimeControls(document.getElementById('time-section'), {
  onSpeedChange: (s) => { speed = s; },
  initial: 'normal',
});
const statBars = new StatBars(document.getElementById('panel-stats'));

// --- Input: drag to pan, wheel to zoom ---
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('mouseup', () => { dragging = false; });
window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  camera.panByScreen(e.clientX - lastX, e.clientY - lastY);
  lastX = e.clientX; lastY = e.clientY;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  camera.zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
}, { passive: false });
window.addEventListener('resize', () => renderer.resize());

// Optional camera positioning for screenshots/debugging: ?cam=tileX,tileY,zoom
function applyCamParam() {
  const p = new URLSearchParams(location.search).get('cam');
  if (!p) return false;
  const parts = p.split(',').map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    camera.x = parts[0] * TILE_SIZE;
    camera.y = parts[1] * TILE_SIZE;
    camera.zoom = parts[2];
    camera.clamp();
    return true;
  }
  return false;
}

// --- Dual loop: requestAnimationFrame render + time-accumulator sim cadence ---
const fpsEl = document.getElementById('fps');
let lastTime = performance.now();
let acc = 0; // accumulated fractional ticks
let frames = 0, fpsLast = lastTime;
let lastPanel = 0;
let didInitialFit = false;

function frame(now) {
  // Once layout has produced a real canvas size, fit the camera to the map
  // (or honor a ?cam= override).
  if (!didInitialFit) {
    renderer.resize();
    if (renderer.cssW > 0) {
      if (!applyCamParam()) camera.fitToView();
      didInitialFit = true;
    }
  }

  const dt = Math.min(now - lastTime, 250) / 1000; // clamp tab-switch gaps
  lastTime = now;

  // Advance the simulation on its own cadence. speed = ticks per real second.
  if (speed > 0) {
    acc += dt * speed;
    let steps = 0;
    while (acc >= 1 && steps < MAX_TICKS_PER_FRAME) {
      simTick(city);
      traffic.onTick(city);
      acc -= 1;
      steps++;
    }
    if (steps === MAX_TICKS_PER_FRAME) acc = 0; // drop backlog; never fast-forward
  }

  traffic.advance(dt);               // cars move in real time -> smooth at any sim speed
  renderer.draw(city.grid, traffic);

  if (now - lastPanel > 150) {       // throttle DOM stat updates to ~7Hz
    timeControls.update(city);
    statBars.update(city);
    lastPanel = now;
  }

  frames++;
  if (now - fpsLast >= 500) {
    const fps = Math.round((frames * 1000) / (now - fpsLast));
    if (fpsEl) fpsEl.textContent = `${fps} fps · ${traffic.cars.length} cars`;
    frames = 0;
    fpsLast = now;
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
