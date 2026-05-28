// ── Image cycling on hover (sidebar photos) ──────────────────────────────────
(function () {
  var img1 = document.getElementById('photo-me');
  if (!img1) return;
  var img2 = document.getElementById('photo-me2');
  var img3 = document.getElementById('photo-me3');
  var img4 = document.getElementById('photo-me4');

  var all_imgs = [img1, img2, img3, img4];
  for (var i = 1; i < all_imgs.length; i++) {
    if (all_imgs[i]) all_imgs[i].style.visibility = 'hidden';
  }

  var imgholder = document.getElementById('images-holder');
  var cnt = 0;

  imgholder.addEventListener('mouseenter', function () {
    cnt = (cnt + 1) % all_imgs.length;
    for (var i = 0; i < all_imgs.length; i++) {
      if (all_imgs[i]) all_imgs[i].style.visibility = (cnt === i) ? 'visible' : 'hidden';
    }
  }, false);
}());

// ── Dark / light toggle ───────────────────────────────────────────────────────
function getLineColor() {
  return document.body.classList.contains('light') ? '#000' : '#d4d4d4';
}

function updateToggleButton() {
  var btn = document.getElementById('dark-toggle');
  if (!btn) return;
  btn.textContent = document.body.classList.contains('light') ? '\u263e' : '\u2600';
  btn.title = document.body.classList.contains('light') ? 'Switch to dark mode' : 'Switch to light mode';
}

function toggleDark() {
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
  updateToggleButton();
  // Redraw lines with updated color
  var old = document.querySelector('svg[data-lines="1"]');
  if (old) old.remove();
  drawLines();
}

// Apply saved theme on load (dark is default)
(function () {
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light');
  }
  updateToggleButton();
}());


// ── Decorative vertical lines ─────────────────────────────────────────────────
function drawLines() {
  var col = document.getElementById('lines-col');
  if (!col) return;

  var rect = col.getBoundingClientRect();
  var w = rect.width;
  if (w === 0) return;

  // 6 random x positions spread across the column width (with small margins)
  var margin = 6;
  var usable = w - margin * 2;
  var xs = [];
  for (var i = 0; i < 6; i++) xs.push(Math.random());
  xs.sort(function (a, b) { return a - b; });
  xs = xs.map(function (v) { return Math.round(margin + v * usable); });

  var svgNS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('data-lines', '1');
  svg.style.position = 'fixed';
  svg.style.top = '0';
  svg.style.left = Math.round(rect.left) + 'px';
  svg.style.width = Math.round(w) + 'px';
  svg.style.height = '100vh';
  svg.style.pointerEvents = 'none';
  svg.style.zIndex = '0';
  svg.setAttribute('xmlns', svgNS);

  var color = getLineColor();
  for (var i = 0; i < 6; i++) {
    var line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', xs[i]);
    line.setAttribute('y1', 0);
    line.setAttribute('x2', xs[i]);
    line.setAttribute('y2', '100%');
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', Math.random() < 0.5 ? 1 : 3);
    svg.appendChild(line);
  }

  document.body.appendChild(svg);
}

window.addEventListener('load', drawLines);
