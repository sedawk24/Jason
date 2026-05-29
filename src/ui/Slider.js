// A labeled range slider. Calls onChange(value) live as the user drags and shows
// the formatted current value.
export class Slider {
  constructor(container, { label, min, max, step, value, format, onChange }) {
    this.format = format || ((v) => String(v));
    this.onChange = onChange;

    const row = document.createElement('div');
    row.className = 'slider-row';

    const head = document.createElement('div');
    head.className = 'slider-head';
    const l = document.createElement('span');
    l.className = 'slider-label';
    l.textContent = label;
    this.valEl = document.createElement('span');
    this.valEl.className = 'slider-value';
    head.appendChild(l);
    head.appendChild(this.valEl);

    this.input = document.createElement('input');
    this.input.type = 'range';
    this.input.className = 'slider-input';
    this.input.setAttribute('aria-label', label);
    this.input.min = min;
    this.input.max = max;
    this.input.step = step;
    this.input.value = value;
    this.input.addEventListener('input', () => {
      const v = parseFloat(this.input.value);
      this.valEl.textContent = this.format(v);
      this.onChange(v);
    });

    row.appendChild(head);
    row.appendChild(this.input);
    container.appendChild(row);

    this.valEl.textContent = this.format(parseFloat(value));
  }
}
