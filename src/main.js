// Color mode (light / dark / system), theme (main / alt) and live color values.
// Everything else on this page is CSS only. The inline script in index.html applies
// the saved choice before first paint; this file wires up the buttons.
const root = document.documentElement;
const modeButtons = document.querySelectorAll('[data-mode]');
const paletteToggle = document.getElementById('palette-toggle');
const altStylesheet = document.getElementById('alt-theme');
const systemLight = window.matchMedia('(prefers-color-scheme: light)');

function read(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked; the choice still applies for this visit.
  }
}

// Color tokens change with mode and theme, so the printed values are read from the computed styles.
function showColorValues() {
  const styles = getComputedStyle(root);
  document.querySelectorAll('.swatch[data-token]').forEach((swatch) => {
    swatch.querySelector('.hex').textContent = styles.getPropertyValue(`--color-${swatch.dataset.token}`).trim();
  });
}

// Dark is the default. System follows the OS when it says light, and falls back to dark otherwise.
let mode = read('theme-mode', 'dark');
let palette = read('theme-palette', 'main');

function applyMode() {
  const resolved = mode === 'system' ? (systemLight.matches ? 'light' : 'dark') : mode;
  root.dataset.theme = resolved === 'light' ? 'light' : 'dark';
  modeButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  showColorValues();
}

function applyPalette() {
  altStylesheet.disabled = palette !== 'alt';
  paletteToggle.setAttribute('aria-pressed', String(palette === 'alt'));
  paletteToggle.textContent = palette === 'alt' ? 'Theme: Alt' : 'Theme: Main';
  showColorValues();
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    mode = button.dataset.mode;
    write('theme-mode', mode);
    applyMode();
  });
});

paletteToggle.addEventListener('click', () => {
  palette = palette === 'alt' ? 'main' : 'alt';
  write('theme-palette', palette);
  applyPalette();
});

// While on System, follow the OS if it changes.
systemLight.addEventListener('change', () => {
  if (mode === 'system') applyMode();
});

// Hamburger menu: the open/closed state is a CSS-only checkbox. Close it after picking a
// section (the page scrolls to the section and the menu would otherwise cover it) or on Escape.
const menuToggle = document.getElementById('menu-toggle');
document.querySelectorAll('.menu nav a').forEach((link) => {
  link.addEventListener('click', () => {
    menuToggle.checked = false;
  });
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') menuToggle.checked = false;
});

// The example form is a demo, so submitting it checks the fields but sends nothing.
document.querySelectorAll('form[data-demo]').forEach((form) => {
  form.addEventListener('submit', (event) => event.preventDefault());
});

// Photo carousel. Swiping, snapping and keyboard scrolling are native CSS scroll-snap. This only
// keeps the arrows, thumbnails and counter in step with the photo that is showing.
const track = document.querySelector('.track');
if (track) {
  const thumbStrip = document.querySelector('.thumbs');
  const thumbs = [...thumbStrip.querySelectorAll('.thumb')];
  const counter = document.querySelector('.counter');
  const prev = document.querySelector('.arrow.prev');
  const next = document.querySelector('.arrow.next');
  const count = track.children.length;
  let current = 0;

  const goTo = (index) => {
    const target = Math.max(0, Math.min(count - 1, index));
    track.scrollTo({ left: target * track.clientWidth }); // CSS scroll-behavior sets smooth or instant
  };

  const render = () => {
    thumbs.forEach((thumb, i) => thumb.setAttribute('aria-current', String(i === current)));
    counter.textContent = `${current + 1} / ${count}`;
    prev.disabled = current === 0;
    next.disabled = current === count - 1;
    // Center the active thumbnail inside its strip. Scrolling the strip itself never moves the page.
    const thumb = thumbs[current];
    thumbStrip.scrollTo({ left: thumb.offsetLeft - (thumbStrip.clientWidth - thumb.offsetWidth) / 2 });
  };

  let frame = 0;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const index = Math.round(track.scrollLeft / track.clientWidth);
      if (index !== current) {
        current = index;
        render();
      }
    });
  }, { passive: true });

  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => goTo(i)));

  track.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); goTo(current + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(current - 1); }
  });

  // Widths change on resize and rotation, so snap back to the current photo.
  window.addEventListener('resize', () => {
    track.scrollTo({ left: current * track.clientWidth, behavior: 'instant' });
  });

  render();
}

applyMode();
applyPalette();
