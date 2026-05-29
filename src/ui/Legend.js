import { TileType, Density } from '../config/constants.js';
import { colorFor, CAR_COLORS } from '../render/tileSprites.js';

// A map legend overlaid on the city view. Colors are pulled from the renderer's
// palette so they always match what's drawn.
const ENTRIES = [
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
  ['Cars', CAR_COLORS[3]],
];

export class Legend {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'legend';

    const title = document.createElement('div');
    title.className = 'legend-title';
    title.textContent = 'Legend';
    this.el.appendChild(title);

    for (const [label, color] of ENTRIES) {
      const row = document.createElement('div');
      row.className = 'legend-row';
      const sw = document.createElement('span');
      sw.className = 'legend-swatch';
      sw.style.background = color;
      const lb = document.createElement('span');
      lb.textContent = label;
      row.appendChild(sw);
      row.appendChild(lb);
      this.el.appendChild(row);
    }

    const note = document.createElement('div');
    note.className = 'legend-note';
    note.textContent = 'Brighter → darker = denser';
    this.el.appendChild(note);

    container.appendChild(this.el);
  }

  toggle() { this.el.classList.toggle('hidden'); }
}
