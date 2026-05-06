// Gear positions in SVG/pixel coordinates (viewBox 0 0 200 220)
// The gate-wrapper is sized 200×220px, so coordinates map 1:1
const GEARS = {
  N: { x: 100, y: 115, label: 'N' },
  1: { x: 50,  y: 55,  label: '1' },
  2: { x: 50,  y: 175, label: '2' },
  3: { x: 100, y: 55,  label: '3' },
  4: { x: 100, y: 175, label: '4' },
  5: { x: 150, y: 55,  label: '5' },
};

const knob       = document.getElementById('knob');
const gateWrap   = document.getElementById('gateWrapper');
const readout    = document.getElementById('readout');
const knobNum    = document.getElementById('knobNum');
const contentEl  = document.querySelector('.content-panel');

let currentGear  = 'N';
let isDragging   = false;
let knobX        = GEARS.N.x;
let knobY        = GEARS.N.y;

// ── SVG coord → CSS px (handles any wrapper size) ───────────────────────────
const SVG_W = 200, SVG_H = 220;

function svgToCSS(svgX, svgY) {
  const w = gateWrap.offsetWidth  || SVG_W;
  const h = gateWrap.offsetHeight || SVG_H;
  return { cssX: svgX * (w / SVG_W), cssY: svgY * (h / SVG_H) };
}

// ── Position knob ────────────────────────────────────────────────────────────
function placeKnob(svgX, svgY, snap = false) {
  const { cssX, cssY } = svgToCSS(svgX, svgY);
  if (snap) {
    knob.style.transition =
      'left 0.28s cubic-bezier(.34,1.56,.64,1), top 0.28s cubic-bezier(.34,1.56,.64,1)';
    setTimeout(() => { knob.style.transition = ''; }, 300);
  } else {
    knob.style.transition = '';
  }
  knob.style.left = cssX + 'px';
  knob.style.top  = cssY + 'px';
  knobX = svgX;
  knobY = svgY;
}

// ── Find nearest gear ────────────────────────────────────────────────────────
function nearestGear(x, y) {
  let best = 'N', bestDist = Infinity;
  for (const [id, pos] of Object.entries(GEARS)) {
    const d = Math.hypot(x - pos.x, y - pos.y);
    if (d < bestDist) { bestDist = d; best = id; }
  }
  return best;
}

// ── Switch gear ───────────────────────────────────────────────────────────────
function changeGear(gear) {
  const pos = GEARS[gear];
  placeKnob(pos.x, pos.y, true);

  if (gear === currentGear) return;
  currentGear = gear;

  // Knob label & readout
  knobNum.textContent  = pos.label;
  readout.textContent  = pos.label;

  // SVG nodes & labels
  document.querySelectorAll('.gear-node').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.gear-label').forEach(l => l.classList.remove('lit'));
  if (gear !== 'N') {
    const node = document.getElementById(`node-${gear}`);
    const lbl  = document.getElementById(`glabel-${gear}`);
    if (node) node.classList.add('active');
    if (lbl)  lbl.classList.add('lit');
  }

  // Nav buttons
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  if (gear !== 'N') {
    const btn = document.querySelector(`.nav-item[data-gear="${gear}"]`);
    if (btn) btn.classList.add('active');
  }

  // Page switch
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageId = gear === 'N' ? 'page-N' : `page-${gear}`;
  const page   = document.getElementById(pageId);
  if (page) {
    // Force reflow to restart animation
    page.style.animation = 'none';
    page.offsetHeight;
    page.style.animation = '';
    page.classList.add('active');
  }

  // Scroll content to top
  contentEl.scrollTop = 0;
}

// ── Mouse drag ────────────────────────────────────────────────────────────────
knob.addEventListener('mousedown', e => {
  isDragging = true;
  knob.classList.add('dragging');
  e.preventDefault();
});

document.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const rect = gateWrap.getBoundingClientRect();
  // Scale mouse coords to SVG space (wrapper is always 200×220 CSS px
  // but getBoundingClientRect gives device px — divide by actual size, multiply by logical)
  const scaleX = 200 / rect.width;
  const scaleY = 220 / rect.height;
  const x = Math.max(0, Math.min(200, (e.clientX - rect.left) * scaleX));
  const y = Math.max(0, Math.min(220, (e.clientY - rect.top)  * scaleY));
  placeKnob(x, y);
});

document.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  knob.classList.remove('dragging');
  changeGear(nearestGear(knobX, knobY));
});

// ── Touch drag ────────────────────────────────────────────────────────────────
knob.addEventListener('touchstart', e => {
  isDragging = true;
  knob.classList.add('dragging');
  e.preventDefault();
}, { passive: false });

document.addEventListener('touchmove', e => {
  if (!isDragging) return;
  const touch = e.touches[0];
  const rect  = gateWrap.getBoundingClientRect();
  const scaleX = 200 / rect.width;
  const scaleY = 220 / rect.height;
  const x = Math.max(0, Math.min(200, (touch.clientX - rect.left) * scaleX));
  const y = Math.max(0, Math.min(220, (touch.clientY - rect.top)  * scaleY));
  placeKnob(x, y);
  e.preventDefault();
}, { passive: false });

document.addEventListener('touchend', () => {
  if (!isDragging) return;
  isDragging = false;
  knob.classList.remove('dragging');
  changeGear(nearestGear(knobX, knobY));
});

// ── Click gear nodes ──────────────────────────────────────────────────────────
document.querySelectorAll('.gear-node').forEach(node => {
  node.addEventListener('click', () => changeGear(node.dataset.gear));
});

// ── Click nav buttons ─────────────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => changeGear(btn.dataset.gear));
});

// ── Init ──────────────────────────────────────────────────────────────────────
placeKnob(GEARS.N.x, GEARS.N.y);

// ── Manuscript modal ──────────────────────────────────────────────────────────
const manuscriptModal = document.getElementById('manuscriptModal');

function openManuscript() {
  manuscriptModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Scroll modal content to top on open
  manuscriptModal.querySelector('.modal-content').scrollTop = 0;
}

function closeManuscript() {
  manuscriptModal.classList.remove('open');
  document.body.style.overflow = '';
}

function closeManuscriptOnBg(e) {
  if (e.target === manuscriptModal) closeManuscript();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeManuscript();
});
