// Tiny deterministic motion engine. Nothing animates on its own: every frame is
// a pure function of time t, so the renderer can capture exact frames.
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  lin: (x) => x,
  inCubic: (x) => x * x * x,
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  outQuart: (x) => 1 - Math.pow(1 - x, 4),
  outQuint: (x) => 1 - Math.pow(1 - x, 5),
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  inOutQuint: (x) => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2),
  outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inExpo: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
  inOutExpo: (x) => x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2,
  inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  inBack: (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x,
};
// Damped spring from 0 to 1, t in seconds since start.
const spring = (t, f = 7, d = 7) => (t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(f * t));
// Eased progress between a and b.
const ease = (t, a, b, fn = E.outCubic) => fn(prog(t, a, b));
// In and out envelope: 0 -> 1 between a..a+i, 1 -> 0 between b-o..b
const env = (t, a, b, i = 0.4, o = 0.4, fi = E.outCubic, fo = E.inCubic) =>
  t < a || t > b ? 0 : Math.min(fi(prog(t, a, a + i)), 1 - fo(prog(t, b - o, b)));

// Seeded random
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let z = s; z = Math.imul(z ^ (z >>> 15), z | 1); z ^= z + Math.imul(z ^ (z >>> 7), z | 61); return ((z ^ (z >>> 14)) >>> 0) / 4294967296; };
}

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
function h(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }

// Set transform and opacity in one go. Skips work when nothing changed.
function tf(el, { x = 0, y = 0, s = 1, sx, sy, r = 0, o, blur, origin } = {}) {
  if (!el) return;
  const t = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${r.toFixed(2)}deg) scale(${(sx ?? s).toFixed(4)},${(sy ?? s).toFixed(4)})`;
  if (el.__t !== t) { el.style.transform = t; el.__t = t; }
  if (o !== undefined) { const v = clamp(o).toFixed(3); if (el.__o !== v) { el.style.opacity = v; el.__o = v; } }
  if (blur !== undefined) { const v = blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : "none"; if (el.__b !== v) { el.style.filter = v; el.__b = v; } }
  if (origin && !el.__origin) { el.style.transformOrigin = origin; el.__origin = 1; }
}
function op(el, o) { if (!el) return; const v = clamp(o).toFixed(3); if (el.__o !== v) { el.style.opacity = v; el.__o = v; } }
function txt(el, s) { if (el && el.__x !== s) { el.textContent = s; el.__x = s; } }
function css(el, k, v) { if (el && el.style[k] !== v) el.style[k] = v; }

// Kinetic type. Wraps each word (or letter) in a mask so it can rise into view.
function split(el, mode = "word") {
  const parts = [];
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        const tokens = mode === "char" ? [...child.textContent] : child.textContent.split(/(\s+)/);
        for (const tk of tokens) {
          if (!tk) continue;
          if (/^\s+$/.test(tk)) { frag.appendChild(document.createTextNode(tk)); continue; }
          const m = document.createElement("span"); m.className = "mask";
          const i = document.createElement("span"); i.className = "rise"; i.textContent = tk;
          m.appendChild(i); frag.appendChild(m); parts.push(i);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === 1) walk(child);
    }
  };
  walk(el);
  el.__parts = parts;
  return parts;
}
// Rise words in from below with a stagger, and out upwards.
function rise(el, t, a, { stagger = 0.06, dur = 0.7, out = Infinity, outDur = 0.45, dist = 110, fn = E.outQuint } = {}) {
  const parts = el.__parts || split(el);
  parts.forEach((p, i) => {
    const k = fn(prog(t, a + i * stagger, a + i * stagger + dur));
    const ko = E.inCubic(prog(t, out + i * stagger * 0.5, out + i * stagger * 0.5 + outDur));
    tf(p, { y: (1 - k) * dist - ko * dist, r: (1 - k) * 4, o: 1 });
  });
  op(el, t >= a - 0.01 && t <= out + outDur + parts.length * stagger ? 1 : 0);
}

// SVG stroke draw. Caches total length.
function draw(path, k) {
  if (!path.__len) { path.__len = path.getTotalLength() || 1; path.style.strokeDasharray = path.__len + " " + path.__len; }
  const v = (path.__len * (1 - clamp(k))).toFixed(1);
  if (path.__d !== v) { path.style.strokeDashoffset = v; path.__d = v; }
}

const fmt = (n) => Math.round(n).toLocaleString("en-US");
const mixHex = (a, b, k) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, clamp(k)));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
// Health colour like the app: coral -> amber -> green
const healthColor = (hv) => (hv < 50 ? mixHex("#ff6b4a", "#f59e0b", hv / 50) : mixHex("#f59e0b", "#22c55e", (hv - 50) / 50));
