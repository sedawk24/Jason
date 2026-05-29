// Live readouts: population, jobs, unemployment, treasury + net flow, power and
// water supply/demand, and the diverging RCI demand bars. Reads city.stats,
// city.economy, and city.demand; never mutates the model.
export class StatBars {
  constructor(container) {
    const root = document.createElement('div');
    root.className = 'stats';

    this.popEl = makeStat(root, 'Population');
    this.jobsEl = makeStat(root, 'Jobs');
    this.unempEl = makeStat(root, 'Unemployment');
    this.treasuryEl = makeStat(root, 'Treasury');
    this.flowEl = makeStat(root, 'Net / week');
    this.powerEl = makeStat(root, 'Power');
    this.waterEl = makeStat(root, 'Water');

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
    const s = city.stats, e = city.economy;
    this.popEl.textContent = fmt(s.population);
    this.jobsEl.textContent = fmt(s.jobsC + s.jobsI);
    this.unempEl.textContent = (s.unemployment * 100).toFixed(0) + '%';

    this.treasuryEl.textContent = money(e.treasury);
    this.treasuryEl.classList.toggle('negative', e.treasury < 0);

    const net = e.lastIncome - e.lastExpenses;
    this.flowEl.textContent = (net >= 0 ? '+' : '−') + money(Math.abs(net));
    this.flowEl.classList.toggle('negative', net < 0);

    setUtil(this.powerEl, s.powerDraw, s.powerCap);
    setUtil(this.waterEl, s.waterDraw, s.waterCap);

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

function setUtil(el, draw, cap) {
  el.textContent = fmt(draw) + ' / ' + fmt(cap);
  el.classList.toggle('negative', draw > cap);
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

function money(v) {
  const a = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (a >= 1e6) return sign + '$' + (a / 1e6).toFixed(1) + 'M';
  if (a >= 1e4) return sign + '$' + (a / 1e3).toFixed(0) + 'k';
  return sign + '$' + Math.round(a).toLocaleString();
}
