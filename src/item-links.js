// Demo for the "Image link lists" section. Two choices are combined: the layout of the list (list, grid,
// shelves) and what happens when a visitor chooses an item (embedded viewer, new tab with a
// welcome-back prompt, expanding card). The items are sample data and all point at one example page.
const URL_B = 'https://en.wikipedia.org/wiki/Literacy';
const CATEGORIES = ['All', 'Travel', 'Food', 'Tech', 'Home'];
const ITEMS = [
  ['Ten Quiet Towns', 'Travel', 'Small places worth a long weekend.'],
  ['Sunday Soup', 'Food', 'One big pot, a slow afternoon, and no recipe.'],
  ['A Calmer Inbox', 'Tech', 'Five settings that stop the noise.'],
  ['The Ten-Minute Reset', 'Home', 'A tidy room before the kettle boils.'],
  ['Night Train Notes', 'Travel', 'Eleven hours, three countries, one good window seat.'],
  ['Bread Without Rules', 'Food', 'Flour, water, salt, and patience.'],
  ['Backups That Work', 'Tech', 'The boring routine that saves the day.'],
  ['A Shelf That Holds', 'Home', 'Wall anchors, explained for people who do not own a drill.'],
  ['The Slow Way Round', 'Travel', 'Why the scenic route is often the faster one.'],
  ['One Pan, Four Ways', 'Food', 'Dinner for a weeknight with almost no washing up.'],
].map(([title, category, blurb], i) => ({ id: i, title, category, blurb, url: URL_B, tint: `p${(i % 6) + 1}` }));

const LAYOUT_NOTES = {
  list: 'List: compact rows with a short description. Best for scanning a lot of items.',
  grid: 'Grid: images lead, so more items fit on screen. Best when every item has a good image.',
  shelves: 'Shelves: one sideways-scrolling row per category, so the whole catalog is a few screens tall. Needs good categories.',
};
const OPENING_NOTES = {
  viewer: 'Embedded viewer: the item loads in a frame on this page, under a bar with Back, Previous and Next. Before using it, check that the other site allows framing and that anything you rely on there (ads, analytics, sign-in) still works inside a frame.',
  newtab: 'New tab: the item opens in a new tab and this page stays open behind it. Items the visitor has opened get a check mark, the next unopened one is outlined, and a banner offers the next item when they come back.',
  expand: 'Expanding card: the card grows in place, so the visitor never has to look somewhere else. In a list it grows taller. In a grid or on a shelf it widens into a larger card. Its Open button opens the item in a new tab.',
};

const READ_KEY = 'item-read';
const readIds = () => {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch { return new Set(); }
};
const saveRead = (set) => {
  try { localStorage.setItem(READ_KEY, JSON.stringify([...set])); } catch { /* storage blocked: marks last for this visit only */ }
};

const demo = document.querySelector('[data-item-demo="playground"]');
if (demo) {
  const $ = (selector) => demo.querySelector(selector);
  const layoutButtons = [...demo.querySelectorAll('[data-layout]')];
  const openingButtons = [...demo.querySelectorAll('[data-opening]')];
  const note = $('.item-note');
  const tools = $('.item-tools');
  const out = $('.item-out');
  const banner = $('.welcome-back');
  const bannerMsg = banner.querySelector('[data-slot="msg"]');
  const bannerOpen = banner.querySelector('[data-act="open"]');
  const resetRow = $('.reset-row');
  const viewer = $('.viewer');
  const frame = viewer.querySelector('iframe');
  const viewerTitle = viewer.querySelector('.viewer-title');
  const viewerPrev = viewer.querySelector('[data-act="prev"]');
  const viewerNext = viewer.querySelector('[data-act="next"]');

  let layout = 'list';
  let opening = 'viewer';
  let category = 'All';
  let query = '';
  let read = readIds();
  let justOpened = null; // the entry the visitor just left for, used by the welcome-back banner
  let current = null; // the entry showing in the embedded viewer

  tools.innerHTML = `
    <input class="input sm" type="search" placeholder="Search items" aria-label="Search items">
    <div class="chips" role="group" aria-label="Category">
      ${CATEGORIES.map((c) => `<button class="chip" type="button">${c}</button>`).join('')}
    </div>`;
  const chips = [...tools.querySelectorAll('.chip')];

  // Items that pass the search and category, in the order they are shown (shelves group by category).
  const shown = () => {
    const q = query.trim().toLowerCase();
    const found = ITEMS.filter((s) => (category === 'All' || s.category === category)
      && (!q || `${s.title} ${s.blurb}`.toLowerCase().includes(q)));
    return layout === 'shelves' ? CATEGORIES.slice(1).flatMap((cat) => found.filter((s) => s.category === cat)) : found;
  };
  const firstUnread = () => ITEMS.find((s) => !read.has(s.id));
  const thumb = (s) => `<span class="item-thumb"><span class="photo ${s.tint}"><span class="n">${s.id + 1}</span></span></span>`;

  const row = (s) => `<a class="item-row" href="${s.url}" target="_blank" rel="noopener" data-id="${s.id}">
    ${thumb(s)}<span class="item-text"><b>${s.title}</b><span>${s.blurb}</span></span><span class="item-state"></span></a>`;
  const tile = (s) => `<a class="item-tile" href="${s.url}" target="_blank" rel="noopener" data-id="${s.id}">
    ${thumb(s)}<b>${s.title}</b><small>${s.category}</small><small class="item-state"></small></a>`;
  const card = (s, isTile) => `<div class="item-card${isTile ? ' is-tile' : ''}" data-open="false">
    ${thumb(s)}
    <div>
      <button class="item-toggle" type="button" aria-expanded="false" aria-controls="item-more-${s.id}"><b>${s.title}</b><span>${s.category}</span></button>
      <div class="item-more" id="item-more-${s.id}" inert>
        <div>
          <p>${s.blurb}</p>
          <a class="btn" href="${s.url}" target="_blank" rel="noopener">Open ↗</a>
        </div>
      </div>
    </div>
    ${isTile ? '' : '<span class="item-chevron" aria-hidden="true"></span>'}
  </div>`;

  function paint() {
    const list = shown();
    layoutButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.layout === layout)));
    openingButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.opening === opening)));
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.textContent === category)));
    tools.querySelector('.chips').hidden = layout === 'shelves'; // shelves are the categories
    resetRow.hidden = opening !== 'newtab';
    note.textContent = `${LAYOUT_NOTES[layout]} ${OPENING_NOTES[opening]}`;

    if (!list.length) {
      out.innerHTML = '<p class="help">No items match.</p>';
    } else if (layout === 'list') {
      const item = opening === 'expand' ? card : row;
      out.innerHTML = `<ul class="item-list">${list.map((s) => `<li>${item(s)}</li>`).join('')}</ul>`;
    } else if (layout === 'grid') {
      const item = opening === 'expand' ? (s) => card(s, true) : tile;
      out.innerHTML = `<ul class="item-grid">${list.map((s) => `<li>${item(s)}</li>`).join('')}</ul>`;
    } else {
      out.innerHTML = CATEGORIES.slice(1).map((cat) => {
        const items = list.filter((s) => s.category === cat);
        return items.length ? `<div class="shelf" role="group" aria-label="${cat}">
          <div class="shelf-head"><h4>${cat}</h4><button type="button" data-see-all="${cat}">See all →</button></div>
          <ul class="shelf-track">${items.map((s) => `<li>${opening === 'expand' ? card(s, true) : tile(s)}</li>`).join('')}</ul></div>` : '';
      }).join('');
    }
    markRead();
  }

  // Visited marks only exist in the new-tab pattern.
  function markRead() {
    const next = firstUnread();
    out.querySelectorAll('[data-id]').forEach((el) => {
      const s = ITEMS[Number(el.dataset.id)];
      const state = opening !== 'newtab' ? null : (read.has(s.id) ? 'read' : (next === s ? 'next' : null));
      if (state) el.dataset.state = state; else delete el.dataset.state;
    });
  }

  function closeViewer() {
    viewer.hidden = true;
    frame.removeAttribute('src');
    tools.hidden = false;
    out.hidden = false;
  }
  function openViewer(entry) {
    current = entry;
    const list = shown();
    const pos = list.findIndex((s) => s.id === entry.id);
    frame.src = entry.url;
    viewerTitle.innerHTML = `${entry.title} <small>${pos + 1} of ${list.length}</small>`;
    viewerPrev.disabled = pos <= 0;
    viewerNext.disabled = pos === -1 || pos >= list.length - 1;
    viewer.querySelectorAll('[data-act="open"]').forEach((a) => { a.href = entry.url; });
    viewer.hidden = false;
    tools.hidden = true;
    out.hidden = true;
    viewer.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }

  function choose(nextLayout, nextOpening) {
    layout = nextLayout;
    opening = nextOpening;
    banner.hidden = true;
    closeViewer();
    paint();
  }

  layoutButtons.forEach((b) => b.addEventListener('click', () => choose(b.dataset.layout, opening)));
  openingButtons.forEach((b) => b.addEventListener('click', () => choose(layout, b.dataset.opening)));
  chips.forEach((c) => c.addEventListener('click', () => { category = c.textContent; paint(); }));
  tools.querySelector('input').addEventListener('input', (e) => { query = e.target.value; paint(); });

  out.addEventListener('click', (e) => {
    const seeAll = e.target.closest('[data-see-all]');
    if (seeAll) { category = seeAll.dataset.seeAll; choose('grid', opening); return; }

    if (opening === 'expand') {
      const item = e.target.closest('.item-card');
      if (!item || e.target.closest('a')) return; // anywhere on the card toggles it, except the Read link
      const open = item.dataset.open !== 'true';
      const change = () => {
        out.querySelectorAll('.item-card[data-open="true"]').forEach((c) => setOpen(c, false));
        setOpen(item, open);
      };
      const grid = out.querySelector('.item-grid');
      if (grid) flip(grid, change); else change();
      return;
    }
    const link = e.target.closest('[data-id]');
    if (!link) return;
    const entry = ITEMS[Number(link.dataset.id)];
    if (opening === 'viewer') {
      e.preventDefault();
      openViewer(entry);
    } else {
      markOpened(entry); // the link itself opens the new tab
    }
  });

  // A grid can't animate a card changing how many columns it spans, so animate it by hand (FLIP): note
  // where every tile is, make the change, then slide each tile from where it was to where it now is. The
  // card that opened or closed also grows or shrinks from its old width. Reduced motion skips all of it.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function flip(grid, change) {
    if (reduceMotion.matches) { change(); return; }
    const slots = [...grid.children];
    const where = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width }; };
    const before = slots.map(where);
    change();
    slots.forEach((slot, i) => {
      const now = where(slot);
      const dx = before[i].x - now.x;
      const dy = before[i].y - now.y;
      const resized = Math.abs(before[i].w - now.w) > 1;
      if (!dx && !dy && !resized) return;
      const from = { transform: `translate(${dx}px, ${dy}px)` };
      const to = { transform: 'none' };
      if (resized) { from.width = `${before[i].w}px`; to.width = `${now.w}px`; }
      slot.animate([from, to], { duration: 300, easing: 'ease-in-out' }); // matches --duration-slow
    });
  }

  // The extra content of an expanding card is inert while closed, so it stays out of the tab order.
  function setOpen(item, open) {
    item.dataset.open = String(open);
    item.querySelector('.item-toggle').setAttribute('aria-expanded', String(open));
    item.querySelector('.item-more').inert = !open;
    growLeft(item, open);
    if (open) reveal(item);
  }

  // On a grid, a card in the last column has no room to widen to the right, so it widens to the left
  // instead and stays where it was. (The tile it covers moves down to the next row.)
  function growLeft(item, open) {
    const slot = item.parentElement;
    const grid = slot.parentElement;
    slot.style.gridColumn = '';
    slot.style.gridRow = '';
    if (!open || !grid.matches('.item-grid')) return;
    const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    const index = [...grid.children].indexOf(slot);
    if (columns > 1 && index % columns === columns - 1) {
      // Pinning the row as well makes the card claim its spot before the tile that was there.
      slot.style.gridRow = String(Math.floor(index / columns) + 1);
      slot.style.gridColumn = `${columns - 1} / span 2`;
    }
  }

  // Only if the opened card runs past the screen: an instant nudge, never an animated scroll. A shelf card
  // widens first, so wait for that to finish before measuring.
  function reveal(item) {
    const slot = item.parentElement;
    const nudge = () => item.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    const animated = slot.matches('.shelf-track > li') && parseFloat(getComputedStyle(slot).transitionDuration) > 0;
    if (animated) slot.addEventListener('transitionend', nudge, { once: true });
    else nudge();
  }

  // Embedded viewer controls
  const step = (d) => {
    const list = shown();
    const target = list[list.findIndex((s) => s.id === current.id) + d];
    if (target) openViewer(target);
  };
  viewerPrev.addEventListener('click', () => step(-1));
  viewerNext.addEventListener('click', () => step(1));
  viewer.querySelector('[data-act="back"]').addEventListener('click', () => {
    closeViewer();
    out.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  });

  // New tab: remember what was opened, and offer the next entry when the visitor comes back.
  function markOpened(entry) {
    read.add(entry.id);
    saveRead(read);
    justOpened = entry;
    markRead();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !justOpened || opening !== 'newtab') return;
    const next = firstUnread();
    bannerMsg.textContent = next
      ? ` You opened “${justOpened.title}”. Up next: “${next.title}”.`
      : ` You opened “${justOpened.title}”. That was the last one.`;
    bannerOpen.hidden = !next;
    if (next) bannerOpen.href = next.url;
    banner.hidden = false;
    justOpened = null;
  });
  bannerOpen.addEventListener('click', () => {
    const next = firstUnread();
    if (next) markOpened(next);
    banner.hidden = true;
  });
  banner.querySelector('[data-act="dismiss"]').addEventListener('click', () => { banner.hidden = true; });
  $('[data-act="reset"]').addEventListener('click', () => {
    read = new Set();
    saveRead(read);
    banner.hidden = true;
    markRead();
  });

  paint();
}
