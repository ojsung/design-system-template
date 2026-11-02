// Color mode (light / dark / system), theme (main / alt) and live color values.
// Everything else on this page is CSS only. The inline script in index.html applies
// the saved choice before first paint; this file wires up the buttons.
const root = document.documentElement;
const modeToggle = document.getElementById('mode-toggle');
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

// System is the default. It follows the OS when it says light, and falls back to dark otherwise.
let mode = read('theme-mode', 'system');
let palette = read('theme-palette', 'main');

function applyMode() {
  const resolved = mode === 'system' ? (systemLight.matches ? 'light' : 'dark') : mode;
  root.dataset.theme = resolved === 'light' ? 'light' : 'dark';
  modeToggle.textContent = `Mode: ${mode[0].toUpperCase()}${mode.slice(1)}`;
  showColorValues();
}

function applyPalette() {
  altStylesheet.disabled = palette !== 'alt';
  paletteToggle.setAttribute('aria-pressed', String(palette === 'alt'));
  paletteToggle.textContent = palette === 'alt' ? 'Theme: Alt' : 'Theme: Main';
  showColorValues();
}

// Mode cycles System, Light, Dark.
const MODES = ['system', 'light', 'dark'];
modeToggle.addEventListener('click', () => {
  mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
  write('theme-mode', mode);
  applyMode();
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

// Top bar. When the section links (or the brand and toolbar) stop fitting on their rows, collapse
// everything into the hamburger menu. Measured with the collapse switched off, so it works at any width.
const topbar = document.querySelector('.topbar');
const topbarRow = topbar.querySelector('.container');
const topbarNav = topbar.querySelector('nav');
const navLinks = new Map([...topbarNav.querySelectorAll('a')].map((link) => [link.getAttribute('href').slice(1), link]));
const sections = [...navLinks.keys()].map((id) => document.getElementById(id)).filter(Boolean);

function fitTopbar() {
  topbar.classList.remove('is-collapsed');
  const crowded = topbarNav.scrollWidth > topbarNav.clientWidth || topbarRow.scrollWidth > topbarRow.clientWidth;
  topbar.classList.toggle('is-collapsed', crowded);
  if (!crowded) menuToggle.checked = false;
  root.style.setProperty('--topbar-height', `${topbar.offsetHeight}px`);
}

// Mark the section being read (the last one whose top has passed just under the bar).
let spyFrame = 0;
function markCurrent() {
  const line = topbar.offsetHeight + 24;
  const current = sections.filter((section) => section.getBoundingClientRect().top <= line).pop();
  navLinks.forEach((link, id) => {
    if (current && current.id === id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

window.addEventListener('resize', fitTopbar);
window.addEventListener('scroll', () => {
  cancelAnimationFrame(spyFrame);
  spyFrame = requestAnimationFrame(markCurrent);
}, { passive: true });
document.fonts?.ready.then(fitTopbar); // web fonts change the widths
fitTopbar();
markCurrent();

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

// View toggle: mobile view swaps the page for a phone-width frame of this same page (?embed), so the
// real mobile breakpoints apply. The same button moves into the bar above the frame. The frame hides
// its own copy of the button via CSS.
const viewToggle = document.getElementById('view-toggle');
const toolbar = viewToggle.parentElement;
let stage = null;

// Touch devices are already mobile, so there the toggle changes the layout viewport instead: Desktop lays
// the page out at a desktop width (the browser scales it to fit), Mobile goes back to the device width.
const touch = 'touch' in root.dataset;
const viewport = document.querySelector('meta[name="viewport"]');

function applyTouchView(view) {
  const mobile = view === 'mobile';
  root.dataset.view = view;
  viewport.content = mobile ? 'width=device-width, initial-scale=1.0' : 'width=1100';
  viewToggle.setAttribute('aria-pressed', String(mobile));
  viewToggle.textContent = mobile ? 'View: Mobile' : 'View: Desktop';
  fitTopbar();
}

function applyView(view) {
  const mobile = view === 'mobile';
  root.dataset.view = mobile ? 'mobile' : 'desktop';
  viewToggle.setAttribute('aria-pressed', String(mobile));
  viewToggle.textContent = mobile ? 'View: Mobile' : 'View: Desktop';
  if (mobile) {
    stage = document.createElement('div');
    stage.className = 'device-stage';
    stage.innerHTML = '<div class="device-bar"><span>Phone-width preview (390px)</span></div><iframe class="device-frame" title="Mobile view"></iframe>';
    stage.querySelector('iframe').src = `?embed${location.hash}`;
    stage.querySelector('.device-bar').append(viewToggle);
    document.body.append(stage);
  } else if (stage) {
    toolbar.append(viewToggle);
    stage.remove();
    stage = null;
  }
}

if (touch) {
  viewToggle.addEventListener('click', () => {
    const next = root.dataset.view === 'mobile' ? 'desktop' : 'mobile';
    write('view-touch', next);
    applyTouchView(next);
  });
  applyTouchView(root.dataset.view);
} else if (!('embed' in root.dataset)) {
  viewToggle.addEventListener('click', () => {
    const next = root.dataset.view === 'mobile' ? 'desktop' : 'mobile';
    write('view', next);
    applyView(next);
  });
  if (read('view', 'desktop') === 'mobile') applyView('mobile');
}

applyMode();
applyPalette();
