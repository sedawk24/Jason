// Live stat readouts: population, jobs, and the RCI demand bars (diverging from
// center, -1..+1). Reads city.stats and city.demand; never mutates the model.
export class StatBars {
  constructor(container) {
    const root = document.createElement('div');
    root.className = 'stats';

    this.popEl = makeStat(root, 'Population');
    this.jobsEl = makeStat(root, 'Jobs');
    this.unempEl = makeStat(root, 'Unemployment');

    const rci = document.createElement('div');
    rci.className = 'rci';
    const head = document.createElement('div');
    head.className = 'rci-head';
    head.textContent = 'Demand';
    rci.appendChild(head);
    this.rFill = makeRciRow(rci, 'R', 'r');
    this.cFill = makeRciRow(rci, 'C', 'c');
    this.iFill = makeRciRow(rci, 'I', 'i');
    root.appendChild(rci);

    container.appendChild(root);
  }

  update(city) {
    this.popEl.textContent = fmt(city.stats.population);
    this.jobsEl.textContent = fmt(city.stats.jobsC + city.stats.jobsI);
    this.unempEl.textContent = (city.stats.unemployment * 100).toFixed(0) + '%';
    setDiverging(this.rFill, city.demand.R);
    setDiverging(this.cFill, city.demand.C);
    setDiverging(this.iFill, city.demand.I);
  }
}

function makeStat(root, label) {
  const row = document.createElement('div');
  row.className = 'stat';
  const l = document.createElement('span');
  l.className = 'stat-label';
  l.textContent = label;
  const v = document.createElement('span');
  v.className = 'stat-value';
  v.textContent = '0';
  row.appendChild(l);
  row.appendChild(v);
  root.appendChild(row);
  return v;
}

function makeRciRow(root, label, cls) {
  const row = document.createElement('div');
  row.className = 'rci-row';
  const l = document.createElement('span');
  l.className = 'rci-label';
  l.textContent = label;
  const track = document.createElement('div');
  track.className = 'rci-track';
  const fill = document.createElement('div');
  fill.className = 'rci-fill ' + cls;
  track.appendChild(fill);
  row.appendChild(l);
  row.appendChild(track);
  root.appendChild(row);
  return fill;
}

function setDiverging(fill, v) {
  v = Math.max(-1, Math.min(1, v));
  if (v >= 0) {
    fill.style.left = '50%';
    fill.style.width = (v * 50) + '%';
  } else {
    fill.style.left = (50 + v * 50) + '%';
    fill.style.width = (-v * 50) + '%';
  }
}

function fmt(n) {
  return Math.round(n).toLocaleString();
}
