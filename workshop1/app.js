'use strict';
const colors = ['#73857d', '#3074bf', '#d87924', '#34976d', '#9863bb', '#cb526f'];
const assignments = new Map();
let datasets;
let activeDataset = null;
const chart = document.getElementById('chart');
const status = document.getElementById('status');
const info = document.getElementById('point-info');

function svgElement(tag, attrs = {}, text = '') {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  node.textContent = text;
  return node;
}

function renderChart(key) {
  document.getElementById('chart-title').textContent = `Dataset ${key.slice(-1)}`;
  document.getElementById('legend').hidden = false;
  info.textContent = '';
  // Keep the same scales across datasets so their positions remain comparable.
  const all = Object.values(datasets).flat();
  const xmax = Math.ceil(Math.max(...all.map(s => s.centroid)) / 1000) * 1000;
  const ymin = Math.floor(Math.min(...all.map(s => s.loudness)) / 5) * 5 - 2;
  const ymax = Math.ceil(Math.max(...all.map(s => s.loudness)) / 5) * 5 + 2;
  const x = value => 76 + value / xmax * 468;
  const y = value => 380 - (value - ymin) / (ymax - ymin) * 340;
  const svg = svgElement('svg', { viewBox: '0 0 580 450', role: 'group', 'aria-label': `${key} : centroïde spectral et loudness` });
  for (let i = 0; i <= 5; i++) {
    const xv = xmax * i / 5;
    const yv = ymin + (ymax - ymin) * i / 5;
    svg.append(svgElement('line', { x1: x(xv), y1: 40, x2: x(xv), y2: 380, class: 'grid-line' }));
    svg.append(svgElement('line', { x1: 76, y1: y(yv), x2: 544, y2: y(yv), class: 'grid-line' }));
    svg.append(svgElement('text', { x: x(xv), y: 402, 'text-anchor': 'middle', class: 'tick' }, Math.round(xv).toLocaleString('fr-FR')));
    svg.append(svgElement('text', { x: 64, y: y(yv) + 4, 'text-anchor': 'end', class: 'tick' }, yv.toFixed(1)));
  }
  svg.append(svgElement('path', { d: 'M76 40 V380 H544', class: 'axis', fill: 'none' }));
  svg.append(svgElement('text', { x: 310, y: 438, 'text-anchor': 'middle', class: 'axis-label' }, 'Centroïde spectral moyen (Hz)'));
  svg.append(svgElement('text', { transform: 'translate(20 210) rotate(-90)', 'text-anchor': 'middle', class: 'axis-label' }, 'Loudness intégrée (LUFS)'));
  const labelBoxes = [];
  datasets[key].forEach(sound => {
    const id = `${key}-${sound.id}`;
    const cls = assignments.get(id) || 0;
    const description = `Son ${sound.id} · ${sound.centroid.toLocaleString('fr-FR')} Hz · ${sound.loudness.toLocaleString('fr-FR')} LUFS · ${cls ? `Classe ${cls}` : 'Sans classe'}`;
    const point = svgElement('g', { class: 'point', tabindex: '0', role: 'button', 'aria-label': `Écouter ${description}`, 'data-sound': id });
    point.append(svgElement('title', {}, description));
    point.append(svgElement('circle', { cx: x(sound.centroid), cy: y(sound.loudness), r: 7, fill: colors[cls] }));
    const px = x(sound.centroid), py = y(sound.loudness);
    const candidates = [[10, -10], [10, 22], [-28, -10], [-28, 22], [10, -28], [10, 40]];
    const [dx, dy] = candidates.find(([dx, dy]) => {
      const left = px + dx, top = py + dy - 12;
      return !labelBoxes.some(b => left < b.x + 22 && left + 22 > b.x && top < b.y + 16 && top + 16 > b.y)
        && !datasets[key].some(s => x(s.centroid) > left - 8 && x(s.centroid) < left + 28 && y(s.loudness) > top - 8 && y(s.loudness) < top + 20);
    }) || candidates[0];
    labelBoxes.push({ x: px + dx, y: py + dy - 12 });
    point.append(svgElement('text', { x: px + dx, y: py + dy }, sound.id));
    const play = () => {
      const player = document.getElementById(`audio-${id}`);
      if (player.paused) player.play().catch(() => { info.textContent = 'Lecture impossible. Utilisez le lecteur du son pour réessayer.'; });
      else player.pause();
    };
    point.addEventListener('click', play);
    point.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); play(); }
    });
    point.addEventListener('mouseenter', () => { info.textContent = description; });
    point.addEventListener('focus', () => { info.textContent = description; });
    svg.append(point);
  });
  chart.replaceChildren(svg);
}

function selectDataset(key) {
  const closing = activeDataset === key;
  document.querySelectorAll('audio').forEach(player => player.pause());
  activeDataset = closing ? null : key;
  document.querySelectorAll('.dataset').forEach(section => {
    const open = section.id === activeDataset;
    section.querySelector('button').setAttribute('aria-expanded', String(open));
    section.querySelector('ol').hidden = !open;
  });
  if (activeDataset) renderChart(activeDataset);
  else {
    chart.replaceChildren();
    document.getElementById('chart-title').textContent = 'Sélectionnez un dataset';
    document.getElementById('legend').hidden = true;
    info.textContent = '';
  }
}

async function init() {
  try {
    const response = await fetch('./features.json');
    if (!response.ok) throw new Error('Audio features unavailable');
    datasets = await response.json();
    Object.entries(datasets).forEach(([key, sounds]) => {
      const section = document.createElement('section');
      section.className = 'dataset';
      section.id = key;
      section.innerHTML = `<h2><button type="button" id="heading-${key}" aria-expanded="false" aria-controls="list-${key}">Dataset ${key.slice(-1)}</button></h2><ol id="list-${key}" class="sound-list" hidden></ol>`;
      section.querySelector('button').addEventListener('click', () => selectDataset(key));
      sounds.forEach(sound => {
        const id = `${key}-${sound.id}`;
        const row = document.createElement('li');
        row.className = 'sound-row';
        row.innerHTML = `<div><span class="sound-label" id="label-${id}">Son ${sound.id}</span><audio id="audio-${id}" controls preload="none" aria-labelledby="heading-${key} label-${id}" src="./audio/${key}/${sound.id}.wav"></audio></div><div><label class="class-label" for="class-${id}">Classe</label><select id="class-${id}" aria-label="Classe du son ${sound.id}, dataset ${key.slice(-1)}"><option value="0">—</option>${[1, 2, 3, 4, 5].map(n => `<option value="${n}">Classe ${n}</option>`).join('')}</select></div>`;
        row.querySelector('select').addEventListener('change', event => {
          assignments.set(id, Number(event.target.value));
          if (activeDataset === key) renderChart(key);
        });
        row.querySelector('audio').addEventListener('play', event => {
          document.querySelectorAll('audio').forEach(other => { if (other !== event.target) other.pause(); });
        });
        section.querySelector('ol').append(row);
      });
      document.getElementById('datasets').append(section);
    });
    colors.forEach((color, i) => {
      const item = document.createElement('span');
      item.className = 'legend-item';
      item.innerHTML = `<span class="swatch" style="background:${color}"></span>${i ? `Classe ${i}` : 'Sans classe'}`;
      document.getElementById('legend').append(item);
    });
    status.textContent = '';
  } catch (error) {
    status.textContent = 'Impossible de charger les datasets. Rechargez la page pour réessayer.';
    console.error(error);
  }
}
init();
