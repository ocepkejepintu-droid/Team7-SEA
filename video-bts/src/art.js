// Illustrations and reusable UI pieces for the video. All vector, all brand colours.
// Stage size: landscape film, or the vertical IG Story cut (window.VERT).
const VW = window.VERT ? 1080 : 1920, VH = window.VERT ? 1920 : 1080;
const C = {
  ink: "#12343b", teal: "#0e9f9a", tealInk: "#0b6b68", tealSoft: "#e6f5f4", sand: "#fbf6ec", muted: "#f3ecdd",
  border: "#eadfc8", coral: "#ff6b4a", coralSoft: "#ffe7e1", good: "#22c55e", goodSoft: "#dcfce7", amber: "#f59e0b",
  sea: "#cfe9ea", sun: "#ffd27a", deep: "#062a2e",
};

// The Hai Pantai mark: ocean and sand meeting in an S-shaped wave, a starfish and a turtle.
function markSVG(id) {
  return `<svg class="mark" id="${id}" viewBox="0 0 64 64" style="overflow:visible">
    <defs><clipPath id="${id}-clip"><circle cx="32" cy="32" r="30"/></clipPath>
      <clipPath id="${id}-reveal"><rect class="m-reveal" x="0" y="0" width="64" height="64"/></clipPath></defs>
    <g clip-path="url(#${id}-clip)">
      <rect width="64" height="64" fill="#22a9a9"/>
      <path class="m-deep" d="M0 0 H20 C11 12 13 26 18 36 C23 46 21 56 15 64 H0Z" fill="#1d8aa7"/>
      <g class="m-turtle" fill="#7fd3cc" opacity=".75">
        <ellipse cx="0" cy="0" rx="3.6" ry="3"/><circle cx="4.4" cy="-1.6" r="1.4"/>
        <ellipse cx="1.8" cy="-3.4" rx="2.2" ry=".9" transform="rotate(-35 1.8 -3.4)"/><ellipse cx="1.8" cy="3.2" rx="2.2" ry=".9" transform="rotate(35 1.8 3.2)"/>
        <ellipse cx="-2.8" cy="-2.6" rx="1.4" ry=".7" transform="rotate(30 -2.8 -2.6)"/><ellipse cx="-2.8" cy="2.6" rx="1.4" ry=".7" transform="rotate(-30 -2.8 2.6)"/>
      </g>
      <g clip-path="url(#${id}-reveal)">
        <path class="m-sand" d="M34 0 C24 10 26 22 31 30 C36 38 38 48 30 64 H64 V0Z" fill="#f4d9a4"/>
        <path d="M47 0 C41 12 44 24 50 32 C56 40 55 54 49 64 H64 V0Z" fill="#e6c387"/>
      </g>
      <path class="m-wave" d="M34 -1 C24 10 26 22 31 30 C36 38 38 48 30 65" fill="none" stroke="#fff" stroke-width="4.6" stroke-linecap="round"/>
      <g class="m-star" fill="#ee6a4c"><path d="M0-4.4 L1.2-1.4 L4.3-1.3 L1.9 0.7 L2.7 3.8 L0 2.1 L-2.7 3.8 L-1.9 0.7 L-4.3-1.3 L-1.2-1.4Z"/></g>
      <circle class="m-dot" cx="41.5" cy="13.5" r="1.4" fill="#ee6a4c"/>
    </g>
  </svg>`;
}
// Animate the mark: k0 is the scene time the mark starts.
function markAnim(m, t, k0) {
  $(".m-reveal", m).setAttribute("width", (64 * ease(t, k0 + 0.25, k0 + 0.85, E.inOutCubic)).toFixed(2));
  draw($(".m-wave", m), ease(t, k0 + 0.3, k0 + 0.95, E.inOutCubic));
  const sk = spring(t - (k0 + 0.8), 14, 7);
  $(".m-star", m).setAttribute("transform", `translate(40 21) rotate(${((1 - sk) * -120 + Math.sin(t * 1.5) * 6).toFixed(2)}) scale(${(t < k0 + 0.8 ? 0 : sk).toFixed(3)})`);
  const dk = spring(t - (k0 + 0.95), 16, 8);
  $(".m-dot", m).setAttribute("transform", `translate(41.5 13.5) scale(${(t < k0 + 0.95 ? 0 : dk).toFixed(3)}) translate(-41.5 -13.5)`);
  const tk = ease(t, k0 + 0.5, k0 + 1.6, E.outCubic);
  $(".m-turtle", m).setAttribute("transform", `translate(${(lerp(8, 24, tk) + Math.sin(t * 1.2) * 0.8).toFixed(2)} ${(lerp(58, 46, tk) + Math.cos(t * 1.4) * 0.6).toFixed(2)}) rotate(${(-40 + tk * 10).toFixed(1)})`);
}

// A beach "photo". dirty=true draws the trash pile. Boxes for Claude's detections.
const TRASH_BOXES = [
  { x: 92, y: 182, w: 74, h: 52, label: "bottle · 0.97" },
  { x: 176, y: 196, w: 92, h: 52, label: "plastic bag · 0.94" },
  { x: 236, y: 166, w: 70, h: 44, label: "bottle · 0.91" },
];
// In the 30s cut the "before" photo is a real report from the live app (bottles, size L).
// Boxes are in percent of that photo.
const REAL_BOXES = [
  { x: 35.5, y: 70, w: 14.5, h: 9, label: "bottle · 0.97" },
  { x: 52, y: 56, w: 9, h: 6.5, label: "bottle · 0.93" },
  { x: 52, y: 82, w: 14, h: 15, label: "bottle · 0.95" },
];
function beachPhoto(dirty, id = "") {
  if (window.SHORT && dirty) return `<img class="photo" src="../assets/report-bottles.jpg" style="object-fit:cover" alt="">`;
  const g = (s) => `${id}${s}`;
  const trash = `
    <g class="trash">
      <ellipse cx="190" cy="238" rx="120" ry="16" fill="#000" opacity=".08"/>
      <!-- fishing net -->
      <path d="M60 236 C90 214 120 244 150 226 C170 214 200 240 230 228" fill="none" stroke="#f97316" stroke-width="2.5" opacity=".9"/>
      <path d="M66 226 l20 18 M86 220 l20 22 M108 224 l18 18 M130 222 l20 18 M66 244 l22 -22 M90 246 l22 -24 M114 244 l20 -20" stroke="#f97316" stroke-width="1.6" opacity=".7"/>
      <!-- bottle 1 -->
      <g transform="translate(100 190) rotate(-18)"><rect x="0" y="8" width="58" height="22" rx="10" fill="#7dd3fc" opacity=".9"/><rect x="56" y="13" width="12" height="12" rx="3" fill="#7dd3fc"/><rect x="66" y="12" width="7" height="14" rx="2" fill="#2563eb"/><rect x="6" y="12" width="40" height="5" rx="2.5" fill="#fff" opacity=".6"/><rect x="14" y="16" width="22" height="10" rx="2" fill="#ef4444" opacity=".8"/></g>
      <!-- bag -->
      <path d="M184 238 C176 212 196 198 214 202 C230 192 262 204 258 226 C262 238 240 246 220 244 C204 248 188 248 184 238Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M200 214 C210 222 230 220 244 214" fill="none" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M214 202 C210 192 220 186 226 194" fill="none" stroke="#cbd5e1" stroke-width="3"/>
      <!-- bottle 2 green -->
      <g transform="translate(244 176) rotate(14)"><rect x="0" y="6" width="44" height="20" rx="9" fill="#4ade80" opacity=".85"/><rect x="42" y="10" width="10" height="12" rx="3" fill="#4ade80"/><rect x="51" y="10" width="6" height="12" rx="2" fill="#166534"/><rect x="5" y="10" width="28" height="4" rx="2" fill="#fff" opacity=".55"/></g>
      <!-- cup and flip flop -->
      <g transform="translate(286 226) rotate(-30)"><path d="M0 0 h22 l-4 26 h-14z" fill="#ef4444"/><rect x="-2" y="-3" width="26" height="5" rx="2" fill="#fca5a5"/></g>
      <g transform="translate(40 252) rotate(-8)"><ellipse cx="18" cy="8" rx="18" ry="8" fill="#facc15"/><path d="M10 4 L18 9 L26 3" stroke="#a16207" stroke-width="2.4" fill="none"/></g>
      <circle cx="170" cy="262" r="4" fill="#94a3b8"/><circle cx="270" cy="258" r="3" fill="#60a5fa"/><rect x="134" y="254" width="12" height="5" rx="2" fill="#f472b6" transform="rotate(20 140 256)"/>
    </g>`;
  const clean = `
    <g class="cleanbits">
      <g fill="#e2c58e"><ellipse cx="120" cy="250" rx="6" ry="3"/><ellipse cx="140" cy="238" rx="6" ry="3"/><ellipse cx="160" cy="250" rx="6" ry="3"/><ellipse cx="180" cy="238" rx="6" ry="3"/><ellipse cx="200" cy="250" rx="6" ry="3"/></g>
      <path transform="translate(262 236)" d="M0-14 L4-4 L14-4 L6 3 L9 13 L0 7 L-9 13 L-6 3 L-14-4 L-4-4Z" fill="#fb923c"/>
      <g fill="#fff"><path transform="translate(96 200)" d="M0-9 L2-2 L9 0 L2 2 L0 9 L-2 2 L-9 0 L-2-2Z"/><path transform="translate(220 214) scale(.7)" d="M0-9 L2-2 L9 0 L2 2 L0 9 L-2 2 L-9 0 L-2-2Z"/></g>
    </g>`;
  return `<svg class="photo" viewBox="0 0 360 300" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="${g("sky")}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9edfe4"/><stop offset="1" stop-color="#fff1d6"/></linearGradient>
      <linearGradient id="${g("sea")}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1fb5ad"/><stop offset="1" stop-color="#5fd0c4"/></linearGradient>
      <linearGradient id="${g("sand")}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2dcae"/><stop offset="1" stop-color="#e9cc92"/></linearGradient>
    </defs>
    <rect width="360" height="300" fill="url(#${g("sky")})"/>
    <circle cx="276" cy="58" r="26" fill="#ffe08a"/><circle cx="276" cy="58" r="40" fill="#ffe08a" opacity=".25"/>
    <path d="M0 96 C40 86 70 92 110 88 C150 84 190 94 230 90 L230 120 L0 120Z" fill="#3f8f6b" opacity=".55"/>
    <rect y="104" width="360" height="62" fill="url(#${g("sea")})"/>
    <path d="M0 122 C30 118 60 126 90 122 S150 118 180 122 240 126 270 122 330 118 360 122" stroke="#fff" stroke-width="2" fill="none" opacity=".5"/>
    <path d="M0 142 C30 138 60 146 90 142 S150 138 180 142 240 146 270 142 330 138 360 142" stroke="#fff" stroke-width="2" fill="none" opacity=".35"/>
    <path d="M0 160 C40 150 80 172 120 162 S200 150 240 162 320 172 360 158 L360 300 L0 300Z" fill="url(#${g("sand")})"/>
    <path d="M0 160 C40 150 80 172 120 162 S200 150 240 162 320 172 360 158" stroke="#fff" stroke-width="5" fill="none" opacity=".75"/>
    <!-- palm -->
    <g transform="translate(26 40)"><path d="M18 130 C20 90 14 60 22 20" stroke="#8b5e34" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M22 20 C0 14 -14 26 -20 36 C-4 26 10 24 22 20Z M22 20 C38 6 56 10 66 20 C48 16 36 18 22 20Z M22 20 C18 0 30 -12 42 -14 C30 -2 26 8 22 20Z M22 20 C6 4 -8 4 -18 10 C-4 8 10 12 22 20Z M22 20 C42 22 52 36 54 46 C44 34 34 26 22 20Z" fill="#2f9e5a"/></g>
    ${dirty ? trash : clean}
  </svg>`;
}

// Map pin like the app's markers: dot with white ring. kind: open | hot | clean | new
function pinSVG(kind) {
  const col = kind === "clean" ? C.good : C.coral;
  return `<svg class="pin pin-${kind}" viewBox="-20 -20 40 40" width="40" height="40">
    ${kind === "hot" ? `<circle class="pin-glow" r="16" fill="${C.coral}" opacity=".25"/>` : ""}
    <circle r="8" fill="${col}" stroke="#fff" stroke-width="3"/>
  </svg>`;
}

// The phone. Screens are absolutely positioned children of .screen
function phoneHTML(id) {
  return `<div class="phone" id="${id}">
    <div class="screen">
      <div class="statusbar"><span>9:41</span><span class="sb-r"><i></i><i></i><i></i><b></b></span></div>
      <div class="island"></div>
    </div>
  </div>`;
}

// Village paths for an SVG. colorFn(village) -> fill
function villagesSVG(colorFn, stroke, sw = 0.5, cls = "") {
  return GEO.villages.map((v, i) => `<path class="${cls}" data-i="${i}" d="${v.d}" fill="${colorFn(v)}" stroke="${stroke}" stroke-width="${sw}"/>`).join("");
}
const beachByName = (n) => GEO.beaches.find((b) => b.name === n);
// Point on a beach's coast closest to its centre
function coastPoint(name, shift = 0) {
  const b = beachByName(name);
  let best = b.pts[0], bd = Infinity;
  for (const p of b.pts) { const d = Math.hypot(p[0] - b.c[0], p[1] - b.c[1] + shift); if (d < bd) { bd = d; best = p; } }
  return best;
}

// App UI bits
const chip = (txt, cls = "") => `<span class="chip ${cls}">${txt}</span>`;
const tabbar = () => `<div class="tabbar"><div class="tab on"><span>🗺️</span>Map</div><div class="tab"><span>🏆</span>League</div><div class="tab"><span>🔨</span>Workshop</div><div class="tab"><span>🙂</span>Me</div></div>`;
// A finger tap indicator
const tapHTML = (id) => `<div class="tap" id="${id}"><div class="tap-dot"></div><div class="tap-ring"></div></div>`;
function tapAt(el, t, at) {
  // visible from at-0.5 to at+0.5, press at `at`
  const vis = env(t, at - 0.45, at + 0.55, 0.2, 0.25);
  const press = 1 - 0.18 * Math.sin(Math.PI * prog(t, at - 0.08, at + 0.14));
  tf(el, { y: (1 - ease(t, at - 0.45, at - 0.1)) * 40, s: press, o: vis });
  const ring = el.querySelector(".tap-ring");
  const k = prog(t, at, at + 0.5);
  tf(ring, { s: 0.6 + E.outCubic(k) * 1.6, o: k > 0 && k < 1 ? 1 - k : 0 });
}
