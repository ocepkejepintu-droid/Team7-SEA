// Scenes 1-4: cold open, the problem, logo, how it works.
const SCENES = [];
const scene = (d) => SCENES.push(d);
const S = TL.S;

// ---------- 1. Cold open: the tide brings a gift ----------
const WAVES = [
  { base: 690, a: 16, k: 0.0042, sp: 0.55, a2: 7, k2: 0.011, sp2: 0.9, fill: "#0a3f44", o: 1 },
  { base: 745, a: 20, k: 0.0036, sp: -0.7, a2: 9, k2: 0.009, sp2: 1.1, fill: "#0b4d52", o: 1 },
  { base: 805, a: 24, k: 0.0031, sp: 0.85, a2: 10, k2: 0.008, sp2: -1.2, fill: "#0c6166", o: 1 },
  { base: 870, a: 28, k: 0.0027, sp: -0.95, a2: 12, k2: 0.007, sp2: 1.3, fill: "#0e7c7b", o: 1 },
  { base: 950, a: 30, k: 0.0024, sp: 1.1, a2: 12, k2: 0.006, sp2: -1.0, fill: "#0e9f9a", o: 0.9 },
];
const waveY = (w, x, t) => w.base + w.a * Math.sin(x * w.k + t * w.sp) + w.a2 * Math.sin(x * w.k2 + t * w.sp2 + 1.3);
function wavePath(w, t, lift = 0) {
  let d = "M-20 1100 L-20 " + (waveY(w, -20, t) - lift).toFixed(1);
  for (let x = 0; x <= 1960; x += 40) d += " L" + x + " " + (waveY(w, x, t) - lift).toFixed(1);
  return d + " L1960 1100 Z";
}

scene({
  name: "cold", t0: S.cold, t1: S.problem,
  build(root) {
    root.innerHTML = `
      <div class="ocean-bg"></div>
      <div id="c-parts"></div>
      <svg class="abs" style="inset:0" width="1920" height="1080" viewBox="0 0 1920 1080">
        <defs><linearGradient id="foam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5eead4" stop-opacity=".55"/><stop offset=".08" stop-color="#5eead4" stop-opacity="0"/></linearGradient></defs>
        ${WAVES.map((w, i) => `<path id="wv${i}" fill="${w.fill}" opacity="${w.o}"/>`).join("")}
        <g id="bottle"><g id="bottle-in">
          <rect x="-62" y="-20" width="104" height="40" rx="18" fill="#a5e8ff" opacity=".85"/>
          <rect x="38" y="-12" width="22" height="24" rx="6" fill="#a5e8ff" opacity=".9"/>
          <rect x="56" y="-14" width="14" height="28" rx="4" fill="#2563eb"/>
          <rect x="-48" y="-13" width="72" height="8" rx="4" fill="#fff" opacity=".6"/>
          <rect x="-34" y="-6" width="40" height="20" rx="4" fill="#ff6b4a" opacity=".85"/>
        </g></g>
        <path id="wv-front" fill="#0e9f9a" opacity=".55"/>
      </svg>
      <div class="abs" style="left:0;right:0;top:250px;text-align:center;color:#fff">
        <div class="h1" id="c-l1" style="font-size:96px">Every morning, the tide<br>brings Bali a little gift.</div>
      </div>
      <div class="abs" id="c-l2" style="left:0;right:0;top:300px;display:flex;justify-content:center;gap:56px;color:#fff">
        <div class="h1 w" style="font-size:150px">Plastic<span style="color:var(--coral)">.</span></div>
        <div class="h1 w" style="font-size:150px">Bottles<span style="color:var(--coral)">.</span></div>
        <div class="h1 w" style="font-size:150px">Nets<span style="color:var(--coral)">.</span></div>
      </div>
      <div class="abs" style="left:0;right:0;top:300px;text-align:center;color:#fff">
        <div class="h1" id="c-l3" style="font-size:130px">And it’s back <span style="color:var(--coral)">tomorrow.</span></div>
        <svg class="abs" id="c-ul" style="left:1020px;top:150px" width="560" height="40" viewBox="0 0 560 40"><path d="M6 26 C120 6 260 34 380 16 S520 18 552 12" stroke="#ff6b4a" stroke-width="9" fill="none" stroke-linecap="round"/></svg>
      </div>
      <div class="vignette"></div>`;
    const parts = $("#c-parts", root);
    const r = rng(7);
    root.__p = [...Array(46)].map(() => {
      const el = h(`<div class="abs" style="border-radius:50%;background:#7ff3e2"></div>`);
      const s = 2 + r() * 5; el.style.width = el.style.height = s + "px";
      parts.appendChild(el);
      return { el, x: r() * 1920, y: r() * 1080, v: 12 + r() * 30, ph: r() * 6.28, o: 0.15 + r() * 0.5 };
    });
    split($("#c-l1", root)); split($("#c-l3", root));
    $$("#c-l2 .w", root).forEach((w) => split(w));
  },
  update(t, root) {
    WAVES.forEach((w, i) => $("#wv" + i, root).setAttribute("d", wavePath(w, t)));
    $("#wv-front", root).setAttribute("d", wavePath({ ...WAVES[4], base: 1000, a: 22 }, t + 2));
    root.__p.forEach((p) => {
      const y = ((p.y - t * p.v) % 1080 + 1080) % 1080;
      tf(p.el, { x: p.x + Math.sin(t * 0.8 + p.ph) * 20, y, o: p.o * (0.6 + 0.4 * Math.sin(t * 2 + p.ph)) });
    });
    // bottle drifts in on wave 4 and washes up
    const bk = ease(t, 2.0, 7.6, E.outCubic);
    const bx = lerp(2120, 1180, bk);
    const by = waveY(WAVES[4], bx, t) - 8 + Math.sin(t * 2.4) * 6 - ease(t, 6, 7.6) * 40;
    tf($("#bottle", root), { x: bx, y: by, r: Math.sin(t * 1.7) * 12 - 18 + bk * 8 });
    // copy
    rise($("#c-l1", root), t, 0.4, { out: 4.0, stagger: 0.07 });
    $$("#c-l2 .w", root).forEach((w, i) => rise(w, t, 4.8 + i * 0.6, { out: 6.8, dist: 180, dur: 0.5 }));
    rise($("#c-l3", root), t, 7.0, { out: 9.0, stagger: 0.08 });
    draw($("#c-ul path", root), ease(t, 7.6, 8.2, E.inOutCubic) * (1 - ease(t, 9.0, 9.3)));
    // outro: push into the map
    const k = ease(t, 8.9, 9.6, E.inCubic);
    tf(root.children[2], { s: 1 + k * 0.25, o: 1 - k, origin: "50% 80%" });
  },
});

// ---------- 2. The problem: 173 beaches, trash on all of them ----------
const ISL = { x: 640, y: 168, w: 1210 };
ISL.s = ISL.w / GEO.w; ISL.h = GEO.h * ISL.s;
function islandSVG(id, { fill = "#0d4a50", coastFill = "#11605f", stroke = "rgba(255,255,255,.08)" } = {}) {
  return `<svg class="abs" id="${id}" style="left:${ISL.x}px;top:${ISL.y}px;overflow:visible" width="${ISL.w}" height="${ISL.h.toFixed(0)}" viewBox="0 0 ${GEO.w} ${GEO.h}">
    <g class="vill">${villagesSVG((v) => (v.b ? coastFill : fill), stroke, 0.7)}</g>
    <g class="coast" fill="none" stroke="#5eead4" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 5px rgba(94,234,212,.8))">
      ${GEO.beaches.map((b) => `<path d="${b.d}"/>`).join("")}
    </g>
    <g class="dots"></g>
  </svg>`;
}
// Trash dots along the coast, shared by the problem and the finale.
const DOTS = (() => {
  const r = rng(42), out = [];
  const pool = GEO.beaches.flatMap((b) => b.pts.map((p) => ({ p, b: b.id })));
  for (let i = 0; i < 96; i++) { const q = pool[Math.floor(r() * pool.length)]; out.push({ x: q.p[0], y: q.p[1], d: r() }); }
  return out.sort((a, b) => a.d - b.d);
})();
function addDots(svg) {
  const g = svg.querySelector(".dots");
  g.innerHTML = DOTS.map((d) => `<g transform="translate(${d.x} ${d.y})"><circle class="ring" r="9" fill="none" stroke="#ff6b4a" stroke-width="3"/><circle class="dot" r="7.5" fill="#ff6b4a" stroke="#fff" stroke-width="2.5"/></g>`).join("");
  return [...g.children].map((el) => ({ el, dot: el.children[1], ring: el.children[0] }));
}
function villageDelays() {
  const cx = GEO.w / 2, cy = GEO.h / 2, md = Math.hypot(cx, cy);
  return GEO.villages.map((v) => Math.hypot(v.c[0] - cx, v.c[1] - cy) / md);
}

scene({
  name: "problem", t0: S.problem, t1: S.logo,
  build(root) {
    root.innerHTML = `
      <div class="ocean-bg"></div>
      <div id="p-cam" class="abs" style="inset:0">${islandSVG("p-isl")}</div>
      <div class="abs" style="left:110px;top:150px;width:620px;color:#fff">
        <div class="eyebrow" id="p-eb" style="color:var(--teal-glow)">Bali · 716 villages</div>
        <div id="p-num" style="font-weight:1000;font-size:230px;letter-spacing:-0.05em;line-height:1;margin-top:20px">0</div>
        <div class="h3" id="p-lab" style="color:#bfeee8">coastal beaches</div>
        <div class="h3" id="p-a" style="margin-top:80px;font-size:50px">Trash washes up on <span style="color:var(--coral)">all of them.</span></div>
        <div class="h3" id="p-b" style="margin-top:26px;font-size:50px;color:#bfeee8">No one knows where.</div>
        <div class="h3" id="p-c" style="margin-top:26px;font-size:50px;color:#bfeee8">No one keeps score.</div>
      </div>
      <div class="abs" style="left:0;right:0;top:390px;text-align:center;color:#fff">
        <div class="h1" id="p-q" style="font-size:150px">What if the coast<br>was <span style="color:var(--sun)">a game?</span></div>
      </div>
      <div class="vignette"></div>
      <div class="abs" id="p-iris" style="left:960px;top:540px;width:0;height:0"><div style="position:absolute;left:-1200px;top:-1200px;width:2400px;height:2400px;border-radius:50%;background:var(--sand)"></div></div>`;
    const svg = $("#p-isl", root);
    root.__v = $$(".vill path", svg); root.__vd = villageDelays();
    root.__c = $$(".coast path", svg).map((p, i) => ({ p, d: GEO.beaches[i].c[0] / GEO.w }));
    root.__dots = addDots(svg);
    ["#p-eb", "#p-lab", "#p-a", "#p-b", "#p-c", "#p-q"].forEach((s) => split($(s, root)));
  },
  update(t, root) {
    root.__v.forEach((p, i) => op(p, ease(t, root.__vd[i] * 1.3, root.__vd[i] * 1.3 + 0.5)));
    root.__c.forEach(({ p, d }) => draw(p, ease(t, 0.6 + d * 1.8, 1.4 + d * 1.8, E.inOutCubic)));
    root.__dots.forEach((d, i) => {
      const a = 3.0 + i * 0.031;
      const k = spring(t - a, 16, 9);
      tf(d.dot, { s: t < a ? 0 : k });
      const rk = prog(t, a, a + 0.9);
      tf(d.ring, { s: 1 + rk * 2.2, o: rk > 0 && rk < 1 ? (1 - rk) * 0.9 : 0 });
    });
    const n = Math.round(173 * ease(t, 1.0, 3.0, E.outQuart));
    txt($("#p-num", root), String(n));
    tf($("#p-num", root), { y: (1 - ease(t, 0.9, 1.4)) * 60, o: ease(t, 0.9, 1.3) * (1 - ease(t, 6.9, 7.3)) });
    rise($("#p-eb", root), t, 0.7, { out: 6.9 });
    rise($("#p-lab", root), t, 1.2, { out: 6.95 });
    rise($("#p-a", root), t, 3.3, { out: 7.0, stagger: 0.04 });
    rise($("#p-b", root), t, 4.5, { out: 7.05, stagger: 0.04 });
    rise($("#p-c", root), t, 5.5, { out: 7.1, stagger: 0.04 });
    // camera: slow push, then dim for the question
    const q = ease(t, 7.5, 8.4, E.inOutCubic);
    tf($("#p-cam", root), { s: 1 + t * 0.006 + q * 0.06, x: -q * 300, o: 1 - q * 0.75, origin: "60% 50%" });
    rise($("#p-q", root), t, 7.8, { stagger: 0.07, dist: 170 });
    const iris = E.inCubic(prog(t, 8.75, 9.6));
    tf($("#p-iris", root), { s: iris, o: iris > 0 ? 1 : 0 });
  },
});

// ---------- 3. Logo ----------
scene({
  name: "logo", t0: S.logo, t1: S.steps,
  build(root) {
    const r = rng(3);
    const shapes = [...Array(34)].map((_, i) => {
      const col = ["#0e9f9a", "#ff6b4a", "#ffd27a", "#5eead4", "#f59e0b"][i % 5];
      const kind = i % 3;
      const html = kind === 0 ? `<div style="width:22px;height:22px;border-radius:50%;background:${col}"></div>`
        : kind === 1 ? `<svg width="54" height="20" viewBox="0 0 54 20"><path d="M3 12 C10 2 17 2 24 10 S38 18 51 8" stroke="${col}" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`
          : `<div style="width:18px;height:18px;border-radius:5px;background:${col}"></div>`;
      const a = r() * Math.PI * 2, d = 420 + r() * 560;
      return { html, x: Math.cos(a) * d * 1.3, y: Math.sin(a) * d * 0.62, r0: r() * 360, vr: (r() - 0.5) * 80, ph: r() * 6, z: 0.5 + r() * 0.9 };
    });
    root.innerHTML = `
      <div class="abs" style="inset:0;background:var(--sand)"></div>
      <div class="abs" style="inset:0;background:radial-gradient(60% 60% at 50% 45%, #fff 0%, rgba(255,255,255,0) 70%)"></div>
      <div class="abs" id="l-conf" style="left:960px;top:470px"></div>
      <div class="abs" id="l-all" style="inset:0">
        <div class="abs" style="left:0;right:0;top:250px;text-align:center"><div class="eyebrow" id="l-eb" style="color:var(--teal)">Hai = hi &nbsp;·&nbsp; pantai = beach</div></div>
        <div class="abs" id="l-lock" style="left:0;right:0;top:320px;display:flex;justify-content:center;align-items:center;gap:46px">
          <div id="l-markw" style="width:250px;height:250px">${markSVG("lm")}</div>
          <div id="l-word" style="font-weight:1000;font-size:196px;letter-spacing:-0.05em;line-height:1;color:var(--ink)">Hai Pantai</div>
        </div>
        <div class="abs" style="left:0;right:0;top:640px;display:flex;justify-content:center;gap:34px" id="l-tag">
          <div class="h2 tg" style="font-size:76px">Report it.</div>
          <div class="h2 tg" style="font-size:76px">Clean it.</div>
          <div class="h2 tg" style="font-size:76px;color:var(--teal);position:relative">Win the beach.
            <svg class="abs" style="left:0;top:78px" width="100%" height="30" viewBox="0 0 470 30" preserveAspectRatio="none"><path id="l-ul" d="M6 18 C80 4 160 26 240 14 S400 10 464 16" stroke="#ffd27a" stroke-width="10" fill="none" stroke-linecap="round"/></svg></div>
        </div>
        <div class="abs body" id="l-sub" style="left:0;right:0;top:800px;text-align:center;font-size:38px">A phone-first game that turns Bali’s coast into a league.</div>
      </div>`;
    const conf = $("#l-conf", root);
    root.__s = shapes.map((s) => { const el = h(`<div class="abs">${s.html}</div>`); conf.appendChild(el); return { ...s, el }; });
    split($("#l-word", root), "char"); split($("#l-eb", root)); split($("#l-sub", root));
    $$(".tg", root).forEach((e) => split(e));
  },
  update(t, root) {
    // confetti bursts out from the mark then drifts
    root.__s.forEach((s, i) => {
      const k = E.outExpo(prog(t, 0.05, 1.6));
      tf(s.el, { x: s.x * k + Math.sin(t * 0.9 + s.ph) * 16 * s.z, y: s.y * k + Math.cos(t * 0.7 + s.ph) * 14 * s.z - t * 6 * s.z, r: s.r0 + s.vr * t, s: s.z * (0.4 + 0.6 * k), o: Math.min(1, k * 3) * (1 - ease(t, 6.3, 7.0)) });
    });
    const m = $("#lm", root);
    const ms = spring(t - 0.0, 9, 6.5);
    tf($("#l-markw", root), { s: ms, r: (1 - ms) * -25 });
    tf($(".m-sun", m), { y: (1 - E.outBack(prog(t, 0.25, 0.9), 2.2)) * 26 });
    tf($(".m-rays", m), { r: t * 30, s: ease(t, 0.5, 1.1, E.outBack) });
    $(".m-reveal", m).setAttribute("width", (64 * ease(t, 0.35, 0.95, E.inOutCubic)).toFixed(2));
    draw($(".m-wave", m), ease(t, 0.5, 1.1, E.inOutCubic));
    rise($("#l-word", root), t, 0.45, { stagger: 0.04, dur: 0.8, dist: 220 });
    rise($("#l-eb", root), t, 1.1, { stagger: 0.04 });
    $$(".tg", root).forEach((e, i) => {
      rise(e, t, 1.8 + i * 0.6, { dur: 0.55, dist: 100 });
      const pk = spring(t - (1.8 + i * 0.6), 14, 8);
      tf(e, { s: 0.7 + 0.3 * pk, origin: "50% 80%" });
    });
    draw($("#l-ul", root), ease(t, 3.15, 3.6, E.inOutCubic));
    rise($("#l-sub", root), t, 3.9, { stagger: 0.03 });
    const out = ease(t, 6.4, 7.2, E.inCubic);
    tf($("#l-all", root), { y: -out * 80, o: 1 - out });
  },
});

// ---------- 4. How it works ----------
const STEPS = [
  { n: "01", t: "Report", d: "Photo + pin on the coast", e: "📷", bg: "#ffe7e1", ink: "#b83a1e" },
  { n: "02", t: "Clean", d: "After photo, Claude checks it", e: "🧹", bg: "#e6f5f4", ink: "#0b6b68" },
  { n: "03", t: "Compete", d: "Cleanest beach wins the week", e: "🏆", bg: "#fef3c7", ink: "#92400e" },
];
scene({
  name: "steps", t0: S.steps, t1: S.report,
  build(root) {
    root.innerHTML = `
      <div class="abs" style="inset:0;background:var(--sand)"></div>
      <div class="abs" style="left:0;right:0;top:120px;text-align:center">
        <div class="eyebrow" id="st-eb" style="color:var(--coral)">How it works</div>
        <div class="h1" id="st-h" style="margin-top:22px;font-size:100px">One loop. Three moves.</div>
      </div>
      <svg class="abs" style="left:0;top:0" width="1920" height="1080">
        <path id="st-a1" d="M704 586 L726 610 L704 634 M1174 586 L1196 610 L1174 634" stroke="#12343b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path id="st-a2" d="M1150 610 L1200 610" stroke="#12343b" stroke-width="6" stroke-linecap="round" fill="none"/>
        <path id="st-loop" d="M1420 832 C1420 990 1180 1000 950 1000 C720 1000 480 990 480 846" stroke="#0e9f9a" stroke-width="7" stroke-linecap="round" fill="none"/>
        <path id="st-head" d="M462 866 L480 836 L498 866" stroke="#0e9f9a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
      <div class="abs body" id="st-lp" style="left:0;right:0;top:960px;text-align:center;font-size:28px;color:var(--teal-ink);font-weight:900"><span style="background:var(--sand);padding:0 18px">… and the beach gets healthier</span></div>
      ${STEPS.map((s, i) => `
        <div class="abs card st-card" style="left:${290 + i * 470 - 20}px;top:400px;width:420px;height:420px;border-radius:44px;background:${s.bg};border-color:transparent;padding:40px">
          <div style="font-weight:1000;font-size:30px;color:${s.ink};letter-spacing:.1em">${s.n}</div>
          <div class="st-ic" style="width:120px;height:120px;border-radius:36px;background:#fff;display:grid;place-items:center;font-size:66px;margin-top:22px;box-shadow:0 10px 0 rgba(0,0,0,.06)">${s.e}</div>
          <div style="font-weight:1000;font-size:72px;letter-spacing:-0.03em;margin-top:28px">${s.t}</div>
          <div style="font-weight:800;font-size:28px;color:${s.ink};margin-top:6px">${s.d}</div>
        </div>`).join("")}`;
    split($("#st-eb", root)); split($("#st-h", root));
  },
  update(t, root) {
    rise($("#st-eb", root), t, 0.05, { out: 3.9 });
    rise($("#st-h", root), t, 0.1, { stagger: 0.06, out: 3.95 });
    $$(".st-card", root).forEach((c, i) => {
      const a = 0.3 + i * 0.6, k = spring(t - a, 10, 7);
      const out = ease(t, 3.9 + i * 0.08, 4.5 + i * 0.08, E.inBack);
      tf(c, { y: (1 - k) * 260 - out * 140, s: 0.9 + 0.1 * k, r: (1 - k) * (i - 1) * 6, o: (t > a ? Math.min(1, (t - a) * 5) : 0) * (1 - out) });
      tf($(".st-ic", c), { s: spring(t - a - 0.15, 16, 8), r: Math.sin(t * 3 + i) * 4 });
    });
    const out = 1 - ease(t, 3.9, 4.3);
    draw($("#st-a1", root), 1); op($("#st-a1", root), ease(t, 1.9, 2.1) * out);
    draw($("#st-a2", root), ease(t, 2.0, 2.3)); op($("#st-a2", root), 0);
    draw($("#st-loop", root), ease(t, 2.3, 3.2, E.inOutCubic)); op($("#st-loop", root), out);
    op($("#st-head", root), ease(t, 3.1, 3.25) * out);
    tf($("#st-lp", root), { y: (1 - ease(t, 2.9, 3.4)) * 30, o: ease(t, 2.9, 3.4) * out });
  },
});
