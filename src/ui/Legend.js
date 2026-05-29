import { TileType, Density } from '../config/constants.js';
import { colorFor, CAR_COLORS } from '../render/tileSprites.js';

// A map legend overlaid on the city view, in two sections: map tiles and cars.
// Colors are pulled from the renderer's palette so they always match.
const TILE_ENTRIES = [
  ['Residential', colorFor(TileType.RESIDENTIAL, Density.MED)],
  ['Commercial', colorFor(TileType.COMMERCIAL, Density.MED)],
  ['Industrial', colorFor(TileType.INDUSTRIAL, Density.MED)],
  ['Road', colorFor(TileType.ROAD)],
  ['Power plant', colorFor(TileType.POWER_PLANT)],
  ['Water tower', colorFor(TileType.WATER_TOWER)],
  ['Police', colorFor(TileType.POLICE)],
  ['Fire station', colorFor(TileType.FIRE)],
  ['School', colorFor(TileType.SCHOOL)],
  ['Water', colorFor(TileType.WATER)],
  ['Open land', colorFor(TileType.LAND)],
];

const CAR_ENTRIES = [
  ['To work (home→job)', CAR_COLORS.toWork],
  ['To home (job→home)', CAR_COLORS.toHome],
  ['Other trip', CAR_COLORS.other],
  ['Congested / slow', CAR_COLORS.congested],
];

export class Legend {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'legend';

    title(this.el, 'Legend');
    for (const [label, color] of TILE_ENTRIES) row(this.el, label, color);
    note(this.el, 'Brighter → darker = denser');

    subhead(this.el, 'Cars (by trip)');
    for (const [label, color] of CAR_ENTRIES) row(this.el, label, color);

    container.appendChild(this.el);
  }

  toggle() { this.el.classList.toggle('hidden'); }
}

function title(parent, text) {
  const el = document.createElement('div');
  el.className = 'legend-title';
  el.textContent = text;
  parent.appendChild(el);
}

function subhead(parent, text) {
  const el = document.createElement('div');
  el.className = 'legend-subhead';
  el.textContent = text;
  parent.appendChild(el);
}

function row(parent, label, color) {
  const r = document.createElement('div');
  r.className = 'legend-row';
  const sw = document.createElement('span');
  sw.className = 'legend-swatch';
  sw.style.background = color;
  const lb = document.createElement('span');
  lb.textContent = label;
  r.appendChild(sw);
  r.appendChild(lb);
  parent.appendChild(r);
}

function note(parent, text) {
  const el = document.createElement('div');
  el.className = 'legend-note';
  el.textContent = text;
  parent.appendChild(el);
}
