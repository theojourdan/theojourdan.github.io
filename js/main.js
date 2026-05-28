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

// ── Color background switcher ─────────────────────────────────────────────────
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

  var rd1 = Math.random() * 20 + 40;
  var rd2 = Math.random() * 45 + 15;
  document.body.style.backgroundPosition = rd1 + '% ' + rd2 + '%';

  var inSubpage = window.location.pathname.indexOf('/pages/') !== -1;
  var prefix = inSubpage ? '../styles/' : './styles/';
  var styleLink = document.getElementById('style-module');
  if (styleLink) {
    styleLink.href = prefix + 'module-' + new_color + '.css';
  }
}

changeBackground();