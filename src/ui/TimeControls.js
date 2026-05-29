import { SIM_SPEEDS, TICK_DAYS, START_YEAR } from '../config/constants.js';

// Speed buttons (Pause / Slow / Normal / Fast) plus an in-game date readout.
// Writes the chosen speed (ticks per real second) back through onSpeedChange.
const SPEED_ORDER = [
  ['paused', 'Pause'],
  ['slow', 'Slow'],
  ['normal', 'Normal'],
  ['fast', 'Fast'],
];

export class TimeControls {
  constructor(container, { onSpeedChange, initial = 'normal' }) {
    this.onSpeedChange = onSpeedChange;
    this.buttons = new Map();

    const root = document.createElement('div');
    root.className = 'time-controls';

    const btnRow = document.createElement('div');
    btnRow.className = 'speed-buttons';
    for (const [name, label] of SPEED_ORDER) {
      const btn = document.createElement('button');
      btn.className = 'speed-btn';
      btn.textContent = label;
      btn.addEventListener('click', () => this.setSpeed(name));
      btnRow.appendChild(btn);
      this.buttons.set(name, btn);
    }

    this.dateEl = document.createElement('div');
    this.dateEl.className = 'date-readout';

    root.appendChild(btnRow);
    root.appendChild(this.dateEl);
    container.appendChild(root);

    this.setSpeed(initial);
  }

  setSpeed(name) {
    this.current = name;
    for (const [n, btn] of this.buttons) btn.classList.toggle('active', n === name);
    this.onSpeedChange(SIM_SPEEDS[name]);
  }

  update(city) {
    this.dateEl.textContent = formatDate(city.tick);
  }
}

function formatDate(tick) {
  const days = tick * TICK_DAYS;
  const year = START_YEAR + Math.floor(days / 364);
  const week = Math.floor((days % 364) / 7) + 1;
  return `Year ${year} · Week ${week}`;
}
