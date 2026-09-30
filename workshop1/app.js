'use strict';
// Original audio directories stay stable; only the participant-facing labels change.
const catalog = [
  { key: 'dataset2', label: 'Dataset 1', description: 'An artist working with field recording recorded a series of sounds from an environment.' },
  { key: 'dataset4', label: 'Dataset 2', description: 'A violinist recorded sounds based on different musical practices and gestures using their instrument.' },
  { key: 'dataset3', label: 'Dataset 3', description: 'An artist resampled a sound synthesis model (RAVE)' }
];
const assignments = new Map();
let datasets;
let activeDataset = null;
const representations = document.getElementById('representations');
const status = document.getElementById('status');
function svgElement(tag, attrs = {}, text = '') {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  node.textContent = text;
  return node;
}
function scatterplot(key, xFeature, yFeature, xLabel, yLabel) {
  const axes = {
    centroid: { min: 1000, max: 8000, ticks: [1000, 3000, 5000, 7000] },
    loudness: { min: -40, max: -10, ticks: [-40, -30, -20, -10] },
    meanFrequency: { min: 0, max: 7000, ticks: [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000] },
    meanEnergy: { min: 0, max: .04, ticks: [0, .01, .02, .03, .04] }
  };
  const { min: xmin, max: xmax, ticks: xticks } = axes[xFeature];
  const { min: ymin, max: ymax, ticks: yticks } = axes[yFeature];
  const x = v => 78 + (v - xmin) / (xmax - xmin) * 430;
  const y = v => 245 - (v - ymin) / (ymax - ymin) * 215;
  const svg = svgElement('svg', { viewBox: '0 0 550 310', role: 'img', 'aria-label': `${xLabel} et ${yLabel}, ${catalog.find(d => d.key === key).label}` });
  svg.append(svgElement('desc', {}, datasets[key].map(s => `Son ${s.id} : ${xLabel} ${s[xFeature]}, ${yLabel} ${s[yFeature]}`).join('; ')));
  const format = v => v.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 2 });
  xticks.forEach(value => {
    svg.append(svgElement('line', { x1: x(value), y1: 30, x2: x(value), y2: 245, class: 'grid-line' }));
    svg.append(svgElement('text', { x: x(value), y: 266, 'text-anchor': 'middle', class: 'tick' }, format(value)));
  });
  yticks.forEach(value => {
    svg.append(svgElement('line', { x1: 78, y1: y(value), x2: 508, y2: y(value), class: 'grid-line' }));
    svg.append(svgElement('text', { x: 68, y: y(value) + 4, 'text-anchor': 'end', class: 'tick' }, format(value)));
  });
  // Mark the upper bound when it is not an exact tick interval from the lower bound.
  if (!xticks.includes(xmax)) {
    svg.append(svgElement('text', { x: x(xmax), y: 266, 'text-anchor': 'middle', class: 'tick' }, format(xmax)));
  }
  svg.append(svgElement('path', { d: 'M78 30 V245 H508', class: 'axis', fill: 'none' }));
  svg.append(svgElement('text', { x: 293, y: 300, 'text-anchor': 'middle', class: 'axis-label' }, xLabel));
  svg.append(svgElement('text', { transform: 'translate(17 138) rotate(-90)', 'text-anchor': 'middle', class: 'axis-label' }, yLabel));
  const boxes = [];
  datasets[key].forEach(sound => {
    const px = x(sound[xFeature]), py = y(sound[yFeature]);
    svg.append(svgElement('circle', { cx: px, cy: py, r: 5, fill: '#808080', class: 'point' }));
    const offsets = [[8,-8],[8,18],[-24,-8],[-24,18],[8,-24],[-24,-24],[8,-40],[-24,-40],[24,-56]];
    const [dx,dy] = offsets.find(([dx,dy]) => py+dy >= 24 && py+dy <= 239 && !boxes.some(b => Math.abs(px+dx-b[0])<22 && Math.abs(py+dy-b[1])<15) && !datasets[key].some(s => Math.abs(x(s[xFeature])-(px+dx+7))<16 && Math.abs(y(s[yFeature])-(py+dy-4))<10)) || offsets[0];
    boxes.push([px+dx,py+dy]);
    svg.append(svgElement('text', { x: px+dx, y: py+dy, class: 'point-label' }, sound.id));
  });
  return svg;
}
function renderRepresentations(dataset) {
  document.getElementById('chart-title').textContent = dataset.label;
  representations.replaceChildren();
  const plots = [
    ['Example 1', 'centroid', 'loudness', 'Centroid Mean (Hz)', 'Loudness Mean (LUFS)'],
    ['Example 2', 'meanFrequency', 'meanEnergy', 'Frequency Mean (Hz)', 'Energy Mean (a.u.)']
  ];
  plots.forEach(([title,xf,yf,xl,yl]) => {
    const section = document.createElement('section');
    section.className = 'example';
    const heading = document.createElement('h3'); heading.textContent = title;
    section.append(heading, scatterplot(dataset.key,xf,yf,xl,yl));
    representations.append(section);
  });
  const section = document.createElement('section'); section.className = 'example';
  section.innerHTML = '<h3>Example 3</h3><table><caption class="sr-only">Classes des sons du dataset sélectionné</caption><thead><tr><th scope="col">Son</th><th scope="col">Classe</th></tr></thead><tbody></tbody></table>';
  datasets[dataset.key].forEach(sound => {
    const id = `${dataset.key}-${sound.id}`;
    const row = document.createElement('tr');
    row.innerHTML = `<th scope="row">Son ${sound.id}</th><td><select aria-label="Classe du son ${sound.id}, ${dataset.label}"><option value="0">—</option>${[1,2,3,4,5].map(n=>`<option value="${n}">Classe ${n}</option>`).join('')}</select></td>`;
    const select = row.querySelector('select'); select.value = assignments.get(id) || '0';
    select.addEventListener('change', () => assignments.set(id,select.value));
    section.querySelector('tbody').append(row);
  });
  representations.append(section);
}
function selectDataset(dataset) {
  document.querySelectorAll('audio').forEach(player => player.pause());
  activeDataset = activeDataset === dataset.key ? null : dataset.key;
  document.querySelectorAll('.dataset').forEach(section => {
    const open = section.id === activeDataset;
    section.querySelector('button').setAttribute('aria-expanded',String(open));
    section.querySelector('.dataset-content').hidden = !open;
  });
  if (activeDataset) renderRepresentations(dataset);
  else { representations.replaceChildren(); document.getElementById('chart-title').textContent = 'Sélectionnez un dataset'; }
}
async function init() {
  try {
    const response = await fetch('./features.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Audio features unavailable');
    datasets = await response.json();
    catalog.forEach(dataset => {
      const key = dataset.key;
      const section = document.createElement('section'); section.className = 'dataset'; section.id = key;
      section.innerHTML = `<h2><button type="button" id="heading-${key}" aria-expanded="false" aria-controls="content-${key}">${dataset.label}</button></h2><div class="dataset-content" id="content-${key}" hidden><p class="dataset-description"></p><ol class="sound-list"></ol></div>`;
      section.querySelector('.dataset-description').textContent = dataset.description;
      section.querySelector('button').addEventListener('click',()=>selectDataset(dataset));
      datasets[key].forEach(sound => {
        const id = `${key}-${sound.id}`;
        const row = document.createElement('li'); row.className = 'sound-row';
        row.innerHTML = `<span class="sound-label" id="label-${id}">Son ${sound.id}</span><audio id="audio-${id}" controls preload="none" aria-labelledby="heading-${key} label-${id}" src="./audio/${key}/${sound.id}.wav?v=${sound.version}"></audio>`;
        row.querySelector('audio').addEventListener('play',event=>document.querySelectorAll('audio').forEach(other=>{if(other!==event.target) other.pause();}));
        section.querySelector('ol').append(row);
      });
      document.getElementById('datasets').append(section);
    });
    status.textContent = '';
  } catch(error) { status.textContent = 'Impossible de charger les datasets. Rechargez la page pour réessayer.'; console.error(error); }
}
init();
