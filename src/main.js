import { City } from './model/City.js';
import { Camera } from './render/camera.js';
import { Renderer } from './render/Renderer.js';
import { TrafficSystem } from './traffic/TrafficSystem.js';
import { TimeControls } from './ui/TimeControls.js';
import { tick as simTick, rehydrate } from './sim/simulate.js';
import { computeStats } from './sim/stats.js';
import { StatBars } from './ui/StatBars.js';
import { ControlPanel } from './ui/ControlPanel.js';
import { Legend } from './ui/Legend.js';
import * as saveLoad from './persistence/saveLoad.js';
import { SIM_SPEEDS, MAX_TICKS_PER_FRAME, TILE_SIZE } from './config/constants.js';

// --- Construct the world ---
const canvas = document.getElementById('cityCanvas');
const camera = new Camera();
const renderer = new Renderer(canvas, camera);

const city = City.createNew(12345);
camera.setWorldSize(city.grid.width, city.grid.height);
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
const panelStatsEl = document.getElementById('panel-stats');
const panelControlsEl = document.getElementById('panel-controls');
let statBars = new StatBars(panelStatsEl);
new ControlPanel(panelControlsEl, city);

const AUTOSAVE_INTERVAL = 300; // ticks
let lastAutosaveTick = 0;

function rebuildSidePanels() {
  panelStatsEl.innerHTML = '';
  panelControlsEl.innerHTML = '';
  statBars = new StatBars(panelStatsEl);
  new ControlPanel(panelControlsEl, city);
}

// --- Overlay selector ---
const legend = new Legend(document.getElementById('cityView'));
document.getElementById('btn-legend').addEventListener('click', () => legend.toggle());

let overlayMode = 'none';
const overlaySelect = document.getElementById('overlay-select');
overlaySelect.addEventListener('change', () => { overlayMode = overlaySelect.value; });
const overlayParam = new URLSearchParams(location.search).get('overlay');
if (overlayParam) { overlayMode = overlayParam; overlaySelect.value = overlayParam; }

// --- Save / Load / New City (with status feedback) ---
const statusEl = document.getElementById('panel-status');
let statusTimer = 0;
function showStatus(msg) {
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.classList.add('visible');
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => statusEl.classList.remove('visible'), 1800);
}

const loadBtn = document.getElementById('btn-load');
function refreshLoadButton() { loadBtn.disabled = !saveLoad.hasSave(); }

document.getElementById('btn-save').addEventListener('click', () => {
  showStatus(saveLoad.save(city) ? 'Saved' : 'Save failed');
  refreshLoadButton();
});
loadBtn.addEventListener('click', () => {
  if (!saveLoad.hasSave()) { showStatus('No save found'); return; }
  if (saveLoad.load(city)) { afterCityReplaced(); showStatus('Loaded'); }
  else showStatus('Load failed');
});
document.getElementById('btn-new').addEventListener('click', () => {
  city.reset(Math.floor(Math.random() * 1e9));
  afterCityReplaced();
  showStatus('New city');
});
refreshLoadButton();

function afterCityReplaced() {
  rehydrate(city);          // force-recompute all derived fields immediately
  traffic.reset();
  traffic.onTick(city);
  rebuildSidePanels();
  userMovedCamera = false;  // refit the camera to the new city
  camera.fitToView();
  lastAutosaveTick = city.tick;
}

// --- Input: drag to pan, wheel to zoom ---
let dragging = false, lastX = 0, lastY = 0;
let userMovedCamera = false;
canvas.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('mouseup', () => { dragging = false; });
window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  camera.panByScreen(e.clientX - lastX, e.clientY - lastY);
  lastX = e.clientX; lastY = e.clientY;
  userMovedCamera = true;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  camera.zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
  userMovedCamera = true;
}, { passive: false });
// Keep the canvas sized to its container. Until the user moves the camera, fit
// the whole map in view on every layout change (handles initial layout settling
// and window resizes). A ?cam= override counts as a user move.
if (applyCamParam()) userMovedCamera = true;
const resizeObserver = new ResizeObserver(() => {
  renderer.resize();
  if (!userMovedCamera && renderer.cssW > 0) camera.fitToView();
});
resizeObserver.observe(canvas);

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

function frame(now) {
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

    if (city.tick - lastAutosaveTick >= AUTOSAVE_INTERVAL) {
      saveLoad.save(city);
      lastAutosaveTick = city.tick;
    }
  }

  traffic.advance(dt);               // cars move in real time -> smooth at any sim speed
  renderer.draw(city.grid, traffic, overlayMode);

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
