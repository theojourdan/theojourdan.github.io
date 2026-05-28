// ── Image cycling on hover (sidebar photos) ──────────────────────────────────
(function () {
  var img1 = document.getElementById('photo-me');
  if (!img1) return;
  var img2 = document.getElementById('photo-me2');
  var img3 = document.getElementById('photo-me3');
  var img4 = document.getElementById('photo-me4');

  var all_imgs = [img1, img2, img3, img4];
  for (var i = 1; i < all_imgs.length; i++) {
    all_imgs[i].style.visibility = 'hidden';
  }

  var imgholder = document.getElementById('images-holder');
  var cnt = 0;

  imgholder.addEventListener('mouseenter', function () {
    cnt = (cnt + 1) % all_imgs.length;
    for (var i = 0; i < all_imgs.length; i++) {
      all_imgs[i].style.visibility = (cnt === i) ? 'visible' : 'hidden';
    }
  }, false);
}());

// ── Color theme switcher ──────────────────────────────────────────────────────
function changeBackground() {
  var colors = ['orange', 'pink', 'green'];
  var button = document.getElementById('color-button');
  if (!button) return;

  var color = button.innerHTML;
  var new_color;
  do {
    new_color = colors[Math.floor(Math.random() * colors.length)];
  } while (new_color === color);

  button.innerHTML = new_color;

  var inSubpage = window.location.pathname.indexOf('/pages/') !== -1;
  var prefix = inSubpage ? '../styles/' : './styles/';
  var styleLink = document.getElementById('style-module');
  if (styleLink) {
    styleLink.href = prefix + 'module-' + new_color + '.css';
  }
}

changeBackground();

// ── Decorative vertical lines ─────────────────────────────────────────────────
function drawLines() {
  var col = document.getElementById('lines-col');
  if (!col) return;

  var rect = col.getBoundingClientRect();
  var w = rect.width;
  if (w === 0) return;

  // Full page height (not just the column height)
  var h = Math.max(
    document.documentElement.scrollHeight,
    document.documentElement.clientHeight
  );

  // 6 random x positions spread across the column width (with small margins)
  var margin = 6;
  var usable = w - margin * 2;
  var xs = [];
  for (var i = 0; i < 6; i++) xs.push(Math.random());
  xs.sort(function (a, b) { return a - b; });
  xs = xs.map(function (v) { return Math.round(margin + v * usable); });

  // Build SVG — positioned fixed so it always covers the full visible + scrollable height
  var svgNS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(svgNS, 'svg');
  svg.style.position = 'fixed';
  svg.style.top = '0';
  svg.style.left = Math.round(rect.left) + 'px';
  svg.style.width = Math.round(w) + 'px';
  svg.style.height = '100vh';
  svg.style.pointerEvents = 'none';
  svg.style.zIndex = '0';
  svg.setAttribute('xmlns', svgNS);

  for (var i = 0; i < 6; i++) {
    var line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', xs[i]);
    line.setAttribute('y1', 0);
    line.setAttribute('x2', xs[i]);
    line.setAttribute('y2', '100%');
    line.setAttribute('stroke', 'black');
    // Randomly normal (1px) or bold (3px)
    line.setAttribute('stroke-width', Math.random() < 0.5 ? 1 : 3);
    svg.appendChild(line);
  }

  document.body.appendChild(svg);
}

window.addEventListener('load', drawLines);