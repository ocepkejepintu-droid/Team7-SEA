// Scenes 8-10: the game layer, under the hood, finale.
const BADGE_LIST = [["📍", "First report"], ["🧹", "First clean"], ["🔟", "Ten cleans"], ["🔥", "Hotspot hunter"], ["💪", "Big haul"], ["🏝️", "Three beaches"]];
const PLAYERS = [["🐢", "wayan", 1240, 0], ["🦀", "made", 1180, 0], ["🐬", "komang", 990, 220], ["🐙", "putu", 870, 0], ["🦩", "ketut", 610, 0]];

scene({
  name: "game", t0: S.game, t1: S.tech,
  build(root) {
    root.innerHTML = `
      <div class="abs" style="inset:0;background:var(--sand)"></div>
      <div class="abs" id="g-all" style="inset:0">
        <div class="abs" style="left:110px;top:80px">
          <div class="eyebrow" id="g-eb" style="color:var(--teal)">The game layer</div>
          <div class="h1" id="g-h" style="font-size:104px;margin-top:14px">Built to be played.</div>
        </div>
        <div class="abs card gc" style="left:110px;top:300px;width:940px;height:360px;border-radius:40px;padding:36px 40px">
          <div class="h3" style="font-size:40px">Badges</div>
          <div style="display:flex;gap:18px;margin-top:30px">${BADGE_LIST.map(([e, n]) => `<div class="bdg" style="width:132px;text-align:center"><div style="width:120px;height:120px;margin:0 auto;border-radius:50%;background:var(--amber-soft);border:4px solid #fcd98a;display:grid;place-items:center;font-size:58px">${e}</div><div style="font-weight:900;font-size:19px;margin-top:12px;line-height:1.1">${n}</div></div>`).join("")}</div>
        </div>
        <div class="abs card gc" style="left:1080px;top:300px;width:730px;height:360px;border-radius:40px;padding:36px 40px;background:var(--teal);border-color:var(--teal);color:#fff">
          <div class="h3" style="font-size:40px">Weekly challenge</div>
          <div style="font-weight:800;font-size:28px;opacity:.85;margin-top:6px">Clean 50 spots this week, together.</div>
          <div style="display:flex;align-items:baseline;gap:12px;margin-top:26px"><span id="g-cnt" style="font-weight:1000;font-size:120px;letter-spacing:-0.05em;line-height:1">0</span><span style="font-weight:1000;font-size:48px;opacity:.7">/ 50</span><span id="g-done" style="font-size:64px;margin-left:auto">🎉</span></div>
          <div style="height:26px;border-radius:13px;background:rgba(255,255,255,.25);margin-top:22px;overflow:hidden"><div id="g-bar" style="height:100%;border-radius:13px;background:var(--sun)"></div></div>
        </div>
        <div class="abs card gc" style="left:110px;top:690px;width:620px;height:320px;border-radius:40px;padding:36px 40px;background:#2a1712;border-color:#2a1712;color:#fff;overflow:hidden">
          <div class="h3" style="font-size:40px">Hotspots pay <span style="color:var(--coral)">×2</span></div>
          <div style="font-weight:800;font-size:26px;opacity:.75;margin-top:8px">Size L, or open for 48 hours.</div>
          <svg class="abs" style="right:40px;bottom:30px" width="180" height="180" viewBox="-90 -90 180 180"><circle id="g-h1" r="40" fill="none" stroke="#ff6b4a" stroke-width="4"/><circle id="g-h2" r="40" fill="none" stroke="#ff6b4a" stroke-width="4"/><circle r="40" fill="#ff6b4a" opacity=".25"/><circle r="22" fill="#ff6b4a" stroke="#fff" stroke-width="6"/></svg>
          <div class="abs" id="g-fire" style="right:84px;bottom:84px;font-size:46px">🔥</div>
        </div>
        <div class="abs card gc" style="left:760px;top:690px;width:1050px;height:320px;border-radius:40px;padding:30px 40px">
          <div class="h3" style="font-size:40px">Players</div>
          <div id="g-pl" style="position:relative;margin-top:14px;height:220px"></div>
        </div>
      </div>
      <div class="abs" id="g-wipe" style="left:0;right:0;bottom:0;height:0;background:#07272b"></div>`;
    const pl = $("#g-pl", root);
    root.__pl = PLAYERS.slice(0, 4).map(([a, n, p, g], i) => {
      const el = h(`<div class="abs" style="left:0;width:960px;height:50px;display:flex;align-items:center;gap:18px;font-weight:900;font-size:28px">
        <span class="pr" style="width:30px;color:var(--muted-ink);font-weight:1000"></span><span style="font-size:34px">${a}</span><span style="flex:1">${n}</span>
        <span class="pp" style="font-weight:1000;color:var(--teal)"></span></div>`);
      pl.appendChild(el); return { el, p, g, i };
    });
    split($("#g-eb", root)); split($("#g-h", root));
  },
  update(t, root) {
    rise($("#g-eb", root), t, 0.05); rise($("#g-h", root), t, 0.1, { stagger: 0.07 });
    $$(".gc", root).forEach((c, i) => { const a = 0.2 + i * 0.2, k = spring(t - a, 10, 7); tf(c, { y: (1 - k) * 160, s: 0.92 + 0.08 * k, o: t > a ? Math.min(1, (t - a) * 5) : 0 }); });
    $$(".bdg", root).forEach((b, i) => { const a = 0.6 + i * 0.3, k = spring(t - a, 15, 7); tf(b, { s: t < a ? 0 : k, r: (1 - k) * -30, y: Math.sin(t * 2 + i) * 4 }); });
    const n = Math.round(50 * ease(t, 1.2, 5.0, E.inOutCubic));
    txt($("#g-cnt", root), String(n)); $("#g-bar", root).style.width = n * 2 + "%";
    tf($("#g-done", root), { s: spring(t - 5.0, 14, 7), r: (1 - spring(t - 5.0, 14, 7)) * 40 });
    [["#g-h1", 0], ["#g-h2", 0.5]].forEach(([s, off]) => { const k = (t * 0.9 + off) % 1; tf($(s, root), {}); $(s, root).setAttribute("r", (24 + k * 60).toFixed(1)); op($(s, root), 1 - k); });
    tf($("#g-fire", root), { y: Math.sin(t * 8) * 3, s: 1 + 0.08 * Math.sin(t * 11) });
    // players: komang's +220 pushes them up
    const pk = ease(t, 3.6, 4.6, E.inOutCubic);
    const pts = root.__pl.map((r) => r.p + r.g * pk);
    root.__pl.forEach((r, i) => {
      let pos = 0; pts.forEach((v, j) => { if (j !== i) pos += sig((v - pts[i]) / 12); });
      const a = 1.0 + i * 0.1, k = spring(t - a, 12, 8);
      tf(r.el, { y: pos * 54, x: (1 - k) * 60, o: t > a ? 1 : 0 });
      txt($(".pp", r.el), fmt(pts[i]) + " pts"); txt($(".pr", r.el), String(Math.round(pos) + 1));
    });
    const out = ease(t, 8.9, 9.5, E.inCubic);
    tf($("#g-all", root), { y: -out * 120, s: 1 - out * 0.05, o: 1 - out * 0.6 });
    $("#g-wipe", root).style.height = (E.inOutCubic(prog(t, 8.95, 9.6)) * 1080).toFixed(1) + "px";
  },
});

// ---------- 9. Under the hood ----------
const NODES = [
  { id: "app", x: 110, y: 380, t: "Phone app", e: "📱", l: ["React · Tailwind · MapLibre", "Map and Satellite modes"] },
  { id: "api", x: 760, y: 300, t: "Node service", e: "⚙️", l: ["REST API · JSON store", "Zero runtime dependencies"] },
  { id: "ai", x: 1410, y: 300, t: "Claude vision", e: "✦", l: ["Tags every photo", "Checks before vs after"] },
  { id: "geo", x: 760, y: 650, t: "Bali coast", e: "🗺️", l: ["716 village polygons", "→ 173 beaches + coastlines"] },
  { id: "rules", x: 1410, y: 650, t: "One rules file", e: "🎲", l: ["Points, health, the league", "Same code in server and app"] },
];
const NW = 400, NH = 250;
const LINKS = [["app", "api", "polls every 5 s"], ["api", "ai", "photos"], ["api", "geo", ""], ["api", "rules", ""]];
scene({
  name: "tech", t0: S.tech, t1: S.finale,
  build(root) {
    const ctr = (n) => [n.x + NW / 2, n.y + NH / 2];
    const by = Object.fromEntries(NODES.map((n) => [n.id, n]));
    const linkPath = ([a, b]) => {
      const A = by[a], B = by[b];
      let [x1, y1] = ctr(A), [x2, y2] = ctr(B);
      if (A.x < B.x) { x1 = A.x + NW; x2 = B.x; } else { x1 = A.x + NW / 2; }
      if (A.id === "api" && B.id === "geo") { x1 = A.x + NW / 2; y1 = A.y + NH; x2 = B.x + NW / 2; y2 = B.y; return `M${x1} ${y1} L${x2} ${y2}`; }
      const mx = (x1 + x2) / 2;
      return `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
    };
    root.innerHTML = `
      <div class="abs" style="inset:0;background:#07272b"></div>
      <div class="abs" id="t-grid" style="inset:-60px;background-image:linear-gradient(rgba(94,234,212,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(94,234,212,.07) 1px,transparent 1px);background-size:60px 60px"></div>
      <div class="abs" id="t-all" style="inset:0;color:#fff">
        <div class="abs" style="left:110px;top:80px">
          <div class="eyebrow" id="t-eb" style="color:var(--teal-glow)">Built in one day</div>
          <div class="h1" id="t-h" style="font-size:104px;margin-top:14px">Under the hood.</div>
        </div>
        <svg class="abs" style="left:0;top:0" width="1920" height="1080">
          ${LINKS.map((l, i) => `<path class="t-link" id="tl${i}" d="${linkPath(l)}" fill="none" stroke="#5eead4" stroke-width="3" opacity=".7"/>`).join("")}
          ${LINKS.map((l, i) => `<circle class="t-pk" id="tp${i}" r="7" fill="#ffd27a"/>`).join("")}
        </svg>
        ${NODES.map((n) => `<div class="abs t-node" style="left:${n.x}px;top:${n.y}px;width:${NW}px;height:${NH}px;border-radius:32px;background:rgba(14,159,154,.12);border:2px solid rgba(94,234,212,.35);padding:30px 32px;backdrop-filter:blur(4px)">
          <div style="display:flex;gap:16px;align-items:center"><div style="width:62px;height:62px;border-radius:20px;background:${n.id === "ai" ? "#ffd27a" : "rgba(94,234,212,.18)"};color:#12343b;display:grid;place-items:center;font-size:34px;font-weight:1000">${n.e}</div><div style="font-weight:1000;font-size:36px;letter-spacing:-0.02em">${n.t}</div></div>
          ${n.l.map((s, i) => `<div style="font-weight:800;font-size:24px;margin-top:${i ? 8 : 26}px;color:${i ? "#5eead4" : "#d7f5f1"}">${s}</div>`).join("")}</div>`).join("")}
        <div class="abs" id="t-lab" style="left:${110 + NW + 14}px;top:${380 + NH / 2 + 16}px;font-weight:900;font-size:20px;color:#ffd27a">polls every 5 s</div>
        <div class="abs" id="t-fb" style="left:110px;top:950px;display:flex;align-items:center;gap:18px;font-weight:800;font-size:30px;color:#d7f5f1">
          <span class="chip" style="height:46px;font-size:20px;background:#ffd27a;border:none;color:#12343b">NO API KEY?</span>
          It still works. Players tag the photo, and cleanups count as unverified.</div>
      </div>`;
    split($("#t-eb", root)); split($("#t-h", root));
  },
  update(t, root) {
    tf($("#t-grid", root), { x: -(t * 12) % 60, y: -(t * 12) % 60 });
    rise($("#t-eb", root), t, 0.1); rise($("#t-h", root), t, 0.15, { stagger: 0.07 });
    const nodes = $$(".t-node", root);
    nodes.forEach((n, i) => { const a = 0.9 + i * 0.6 - (i === 0 ? 0.2 : 0), k = spring(t - a, 11, 7); tf(n, { y: (1 - k) * 80, s: 0.85 + 0.15 * k, o: t > a ? Math.min(1, (t - a) * 4) : 0 }); });
    LINKS.forEach((l, i) => {
      const p = $("#tl" + i, root), a = 1.6 + i * 0.5;
      draw(p, ease(t, a, a + 0.6, E.inOutCubic));
      const pk = $("#tp" + i, root);
      if (t > a + 0.6) {
        const u = ((t - a - 0.6) * 0.55 + i * 0.27) % 1;
        const pt = p.getPointAtLength(p.__len * u);
        pk.setAttribute("cx", pt.x.toFixed(1)); pk.setAttribute("cy", pt.y.toFixed(1)); op(pk, Math.sin(Math.PI * u));
      } else op(pk, 0);
    });
    tf($("#t-lab", root), { o: ease(t, 2.3, 2.7) });
    tf($("#t-fb", root), { y: (1 - spring(t - 5.6, 10, 7)) * 60, o: t > 5.6 ? 1 : 0 });
    const out = ease(t, 8.8, 9.6, E.inCubic);
    tf($("#t-all", root), { s: 1 + out * 0.2, o: 1 - out, blur: out * 12 });
  },
});

// ---------- 10. Finale: the coast turns green ----------
scene({
  name: "finale", t0: S.finale, t1: S.end,
  build(root) {
    root.innerHTML = `
      <div class="ocean-bg"></div>
      <div class="abs" id="f-cam" style="inset:0">${islandSVG("f-isl", { fill: "#0b3f44", coastFill: "#0e5552" })}</div>
      <div class="abs" id="f-sweep" style="top:0;bottom:0;width:420px;background:linear-gradient(90deg,rgba(34,197,94,0),rgba(94,234,212,.16),rgba(34,197,94,0))"></div>
      <div class="abs" id="f-stat" style="left:110px;top:120px;color:#fff">
        <div class="eyebrow" style="color:var(--teal-glow)">Open reports</div>
        <div id="f-n" style="font-weight:1000;font-size:200px;letter-spacing:-0.05em;line-height:1;margin-top:10px">96</div>
      </div>
      <div class="abs" id="f-lock" style="left:0;right:0;top:330px;text-align:center;color:#fff">
        <div style="display:flex;justify-content:center;align-items:center;gap:40px">
          <div id="f-markw" style="width:210px;height:210px;filter:drop-shadow(0 20px 50px rgba(14,159,154,.6))">${markSVG("fm")}</div>
          <div id="f-word" style="font-weight:1000;font-size:180px;letter-spacing:-0.05em;line-height:1;color:var(--sand)">Hai Pantai</div>
        </div>
        <div class="h3" id="f-tag" style="margin-top:44px;font-size:60px;color:#bfeee8">Bali’s coast is the <span style="color:var(--sun)">scoreboard.</span></div>
        <div id="f-cta" style="display:inline-flex;align-items:center;gap:18px;margin-top:56px;height:88px;padding:0 44px;border-radius:999px;background:var(--sand);color:var(--ink);font-weight:1000;font-size:38px">Play the demo <span style="color:var(--teal)">→ 43.163.0.197/pantai</span></div>
      </div>
      <div class="abs" id="f-foot" style="left:0;right:0;bottom:60px;text-align:center;font-weight:900;font-size:26px;letter-spacing:.2em;text-transform:uppercase;color:#5eead4">Team 7 · Hackathon · 10 Nov 2026</div>
      <div class="vignette"></div>
      <div class="abs" id="f-black" style="inset:0;background:#000"></div>`;
    const svg = $("#f-isl", root);
    root.__dots = addDots(svg);
    root.__v = $$(".vill path", svg).map((p, i) => ({ p, v: GEO.villages[i] }));
    root.__c = $$(".coast path", svg);
    split($("#f-word", root), "char"); split($("#f-tag", root));
  },
  update(t, root) {
    const SX = (gx) => ISL.x + gx * ISL.s; // geo x to screen x
    const front = lerp(ISL.x - 200, ISL.x + ISL.w + 200, ease(t, 0.3, 3.6, E.inOutCubic));
    tf($("#f-sweep", root), { x: front - 210, o: t > 0.3 && t < 3.8 ? 1 : 0 });
    let open = 0;
    root.__dots.forEach((d, i) => {
      const dx = SX(DOTS[i].x), pass = prog(front, dx - 10, dx + 30);
      const g = pass >= 1 || front > dx;
      if (!g) open++;
      d.dot.setAttribute("fill", g ? "#22c55e" : "#ff6b4a");
      const k = g ? prog(t, 0, 0) : 0;
      const since = g ? (front - dx) / 500 : 0;
      tf(d.dot, { s: g ? 1 + 0.6 * Math.max(0, 1 - since * 3) : 1 });
      const rk = clamp(since * 2.4);
      d.ring.setAttribute("stroke", "#22c55e");
      tf(d.ring, { s: 1 + rk * 3, o: g && rk < 1 ? (1 - rk) : 0 });
    });
    txt($("#f-n", root), String(open));
    css($("#f-n", root), "color", open === 0 ? "#5eead4" : "#fff");
    root.__v.forEach(({ p, v }) => { if (!v.b) return; const g = front > SX(v.c[0]); const c = g ? "#138a5e" : "#0e5552"; if (p.__f !== c) { p.setAttribute("fill", c); p.__f = c; } });
    root.__c.forEach((p) => css(p, "stroke", "#5eead4"));
    // lockup
    const dim = ease(t, 3.9, 4.9, E.inOutCubic);
    tf($("#f-cam", root), { s: 1 + t * 0.01 + dim * 0.08, o: 1 - dim * 0.72, blur: dim * 3, origin: "60% 50%" });
    tf($("#f-stat", root), { y: -dim * 40, o: 1 - dim });
    const ms = spring(t - 4.2, 9, 6.5);
    tf($("#f-markw", root), { s: ms, r: (1 - ms) * -25 });
    const m = $("#fm", root);
    markAnim(m, t, 4.2);
    rise($("#f-word", root), t, 4.5, { stagger: 0.04, dur: 0.8, dist: 220 });
    rise($("#f-tag", root), t, 5.3, { stagger: 0.06 });
    const ck = spring(t - 6.0, 10, 7);
    tf($("#f-cta", root), { y: (1 - ck) * 60, s: 0.9 + 0.1 * ck, o: t > 6.0 ? 1 : 0 });
    tf($("#f-foot", root), { o: ease(t, 6.6, 7.2) });
    op($("#f-black", root), ease(t, 8.7, 9.6, E.inOutSine));
  },
});
