import { Grid } from './model/Grid.js';
import { Camera } from './render/camera.js';
import { Renderer } from './render/Renderer.js';
import { mulberry32 } from './model/rng.js';

// --- Construct the world (Phase A: a bare-land grid; no simulation yet) ---
const canvas = document.getElementById('cityCanvas');
const camera = new Camera();
const renderer = new Renderer(canvas, camera);

const rng = mulberry32(12345);
const grid = new Grid();
grid.generate(rng);

// --- Input: drag to pan, wheel to zoom ---
let dragging = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener('mousedown', (e) => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});
window.addEventListener('mouseup', () => { dragging = false; });
window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  camera.panByScreen(e.clientX - lastX, e.clientY - lastY);
  lastX = e.clientX;
  lastY = e.clientY;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  camera.zoomAt(e.clientX - rect.left, e.clientY - rect.top, factor);
}, { passive: false });

window.addEventListener('resize', () => renderer.resize());

// --- Render loop + FPS counter ---
const fpsEl = document.getElementById('fps');
let frames = 0;
let fpsLast = performance.now();
let didInitialFit = false;

function frame(now) {
  // Ensure the camera fits the map once layout has produced a real canvas size.
  if (!didInitialFit) {
    renderer.resize();
    if (renderer.cssW > 0) {
      camera.fitToView();
      didInitialFit = true;
    }
  }

  renderer.draw(grid);

  frames++;
  if (now - fpsLast >= 500) {
    const fps = Math.round((frames * 1000) / (now - fpsLast));
    if (fpsEl) fpsEl.textContent = `${fps} fps · ${renderer.lastDrawnTiles} tiles`;
    frames = 0;
    fpsLast = now;
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
