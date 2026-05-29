import { Slider } from './Slider.js';

// The policy controls. Sliders write directly to city.params -- the only thing
// the UI is allowed to mutate on the model. (Phase E adds service-funding sliders.)
export class ControlPanel {
  constructor(container, city) {
    const pct = (v) => Math.round(v * 100) + '%';

    const taxes = group(container, 'Tax rates');
    new Slider(taxes, { label: 'Residential', min: 0, max: 0.20, step: 0.01, value: city.params.taxR, format: pct, onChange: (v) => { city.params.taxR = v; } });
    new Slider(taxes, { label: 'Commercial', min: 0, max: 0.20, step: 0.01, value: city.params.taxC, format: pct, onChange: (v) => { city.params.taxC = v; } });
    new Slider(taxes, { label: 'Industrial', min: 0, max: 0.20, step: 0.01, value: city.params.taxI, format: pct, onChange: (v) => { city.params.taxI = v; } });

    const budgets = group(container, 'Budgets');
    new Slider(budgets, { label: 'Roads', min: 0, max: 1, step: 0.05, value: city.params.budgetRoads, format: pct, onChange: (v) => { city.params.budgetRoads = v; } });
    new Slider(budgets, { label: 'Utilities', min: 0, max: 1, step: 0.05, value: city.params.budgetUtil, format: pct, onChange: (v) => { city.params.budgetUtil = v; } });
  }
}

function group(container, title) {
  const g = document.createElement('div');
  g.className = 'ctrl-group';
  const h = document.createElement('div');
  h.className = 'ctrl-group-title';
  h.textContent = title;
  g.appendChild(h);
  container.appendChild(g);
  return g;
}
