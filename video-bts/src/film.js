// "Hai Pantai: built in one hour" — a 30 s vertical film (1080×1920).
// Every frame is a pure function of time t (see lib.js), so the renderer can capture exact frames.
const S = TL.S;
const world = $("#world");
const SC = [];
function addScene(name, t0, t1, build, update, { pre = 0, post = 0 } = {}) {
  const root = document.createElement("div");
  root.className = "scene"; root.dataset.name = name;
  world.appendChild(root);
  build(root);
  SC.push({ name, t0, t1, pre, post, root, update });
}

// ---------- shared bits ----------
const GW = GEO.w, GH = GEO.h;
const LAND_D = GEO.villages.map((v) => v.d).join("");
const coastD = (b) => "M" + b.pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L");
const COASTS = GEO.beaches.map((b) => `<path d="${coastD(b)}" data-x="${b.c[0]}"/>`).join("");
const pad2 = (n) => String(n).padStart(2, "0");
const fmtClock = (sec) => { const s = Math.floor(sec) + 15 * 3600; return `${Math.floor(s / 3600)}:${pad2(Math.floor(s / 60) % 60)}:${pad2(s % 60)}`; };
const GH_MARK = `<svg class="gh-ico" viewBox="0 0 16 16" fill="#e6edf3"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`;
const COMMIT_ICO = `<svg class="gh-ico" viewBox="0 0 16 16" fill="#5eead4"><path d="M11.93 8.5a4.002 4.002 0 01-7.86 0H.75a.75.75 0 010-1.5h3.32a4.002 4.002 0 017.86 0h3.32a.75.75 0 010 1.5zm-1.43-.75a2.5 2.5 0 10-5 0 2.5 2.5 0 005 0z"/></svg>`;
// Scene-level fade, used for in/out envelopes on a whole group.
const fadeGroup = (el, u, a, b, i = 0.3, o = 0.3, dy = 60) => {
  const ki = E.outCubic(prog(u, a, a + i)), ko = E.inCubic(prog(u, b - o, b));
  tf(el, { y: (1 - ki) * dy - ko * dy, o: Math.min(ki, 1 - ko) });
};

// =====================================================================
// 1. HOOK  0–3 s: "One hour. One game. For Bali's trash." + the clock
// =====================================================================
addScene("hook", S.hook, S.product, (root) => {
  const r = rng(7);
  const dots = [...Array(48)].map(() => {
    const b = GEO.beaches[Math.floor(r() * GEO.beaches.length)], p = b.pts[Math.floor(r() * b.pts.length)];
    return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="0" fill="#ff6b4a" stroke="#fff" stroke-width="3"/>`;
  }).join("");
  root.innerHTML = `
    <div class="abs" id="hk-all" style="inset:0;transform-origin:540px 900px">
      <div class="deep-bg"></div><div class="gridlines"></div>
      <svg class="abs" style="left:-80px;top:1170px;width:1240px;height:771px" viewBox="0 0 ${GW} ${GH}">
        <path d="${LAND_D}" fill="#0b3d42"/>
        <g id="hk-coast" fill="none" stroke="#5eead4" stroke-width="3.5" stroke-linecap="round" opacity=".75">${COASTS}</g>
        <g id="hk-dots">${dots}</g>
      </svg>
      <div class="abs" style="left:0;right:0;top:0;height:1300px;background:linear-gradient(#021012 55%, rgba(2,16,18,0))"></div>
      <div class="abs" style="left:80px;top:280px;width:940px">
        <div class="hl white" id="hk1" style="font-size:172px">One hour.</div>
        <div class="hl white" id="hk2" style="font-size:172px;margin-top:4px">One game.</div>
        <div class="hl white" id="hk3" style="font-size:112px;margin-top:26px">For Bali’s <span class="coral">trash.</span></div>
      </div>
      <div class="abs" id="hk-tw" style="left:0;right:0;top:900px;text-align:center;transform-origin:540px 150px">
        <div class="eb coral" style="display:inline-flex;align-items:center;gap:16px"><i id="hk-rec" style="display:block;width:22px;height:22px;border-radius:50%;background:var(--coral);box-shadow:0 0 20px var(--coral)"></i>The clock starts now</div>
        <div class="mono" id="hk-timer" style="font-weight:800;font-size:250px;line-height:1.05;color:var(--sun);letter-spacing:-0.05em;margin-top:6px;text-shadow:0 0 70px rgba(255,210,122,.4)">60:00</div>
      </div>
    </div>
    <div class="abs" id="hk-flash" style="inset:0;background:#fff;opacity:0"></div>`;
  ["#hk1", "#hk2", "#hk3"].forEach((s) => split($(s, root)));
  root.__coast = $$("#hk-coast path", root);
  root.__dots = $$("#hk-dots circle", root);
}, (u, root) => {
  rise($("#hk1", root), u, 0.08, { dist: 200, stagger: 0.06 });
  rise($("#hk2", root), u, 0.58, { dist: 200, stagger: 0.06 });
  rise($("#hk3", root), u, 1.08, { dist: 150, stagger: 0.05 });
  root.__coast.forEach((p, i) => draw(p, ease(u, 0.05 + (i % 40) * 0.012, 1.0 + (i % 40) * 0.012, E.inOutCubic)));
  root.__dots.forEach((c, i) => { const a = 0.35 + i * 0.045; const k = u < a ? 0 : spring(u - a, 16, 7); const v = (k * 11).toFixed(2); if (c.__r !== v) { c.setAttribute("r", v); c.__r = v; } });
  // the clock: appears on 1.6, ticks on every eighth note from 2.0
  const ticks = u < 2.0 ? 0 : Math.min(4, 1 + Math.floor((u - 2.0) / 0.25));
  txt($("#hk-timer", root), ticks ? `59:${pad2(60 - ticks)}` : "60:00");
  const lastTick = ticks ? 2.0 + (ticks - 1) * 0.25 : 1.6;
  const bump = 1 + 0.07 * (1 - E.outCubic(prog(u, lastTick, lastTick + 0.2)));
  const k = u < 1.55 ? 0 : spring(u - 1.55, 13, 8);
  tf($("#hk-tw", root), { y: (1 - k) * 80, s: (0.7 + 0.3 * k) * bump, o: clamp((u - 1.55) * 7) });
  op($("#hk-rec", root), 0.35 + 0.65 * (Math.sin(u * 14) > -0.2 ? 1 : 0));
  // out: punch through the screen into the product
  const ko = ease(u, 2.72, 3.0, E.inCubic);
  tf($("#hk-all", root), { s: 1 + ko * 0.5, blur: ko * 16, o: 1 - ko * 0.6 });
  op($("#hk-flash", root), ease(u, 2.82, 3.0, E.inCubic));
});

// =====================================================================
// 2. PRODUCT  3–9 s: logo, then the app in three moves
// =====================================================================
const LEAGUE = [["Sanur", 90], ["Canggu", 80], ["Seminyak", 75], ["Jimbaran", 70], ["Legian", 60]];
addScene("product", S.product, S.rewind, (root) => {
  const boxes = REAL_BOXES.map((b) => `<div class="det" style="left:${b.x}%;top:${b.y}%;width:${b.w}%;height:${b.h}%"><i>${b.label}</i></div>`).join("");
  root.innerHTML = `
    <div class="abs" id="pr-all" style="inset:0">
      <div class="abs" style="inset:0;background:var(--sand)"></div>
      <div class="abs" style="inset:0;background:radial-gradient(70% 45% at 50% 42%, #fff 0%, rgba(255,255,255,0) 70%)"></div>
      <div class="abs" id="pr-lock" style="inset:0">
        <div class="abs eb" id="pr-eb" style="left:0;right:0;top:470px;text-align:center;color:var(--teal)">What we shipped</div>
        <div class="abs" id="pr-markw" style="left:405px;top:540px;width:270px;height:270px">${markSVG("pm")}</div>
        <div class="abs" id="pr-word" style="left:0;right:0;top:850px;text-align:center;font-weight:1000;font-size:180px;letter-spacing:-0.05em;line-height:1;color:var(--ink)">Hai Pantai</div>
        <div class="abs" id="pr-tag" style="left:0;right:0;top:1075px;text-align:center;font-weight:900;font-size:68px;line-height:1.08;letter-spacing:-0.03em;color:var(--ink)">Report it. Clean it.<br><span style="color:var(--teal)">Win the beach.</span></div>
      </div>
      <div class="abs" id="pr-head" style="left:0;right:0;top:262px;display:flex;justify-content:center;align-items:center;gap:20px">
        <div style="width:82px;height:82px">${markSVG("pm2")}</div>
        <div style="font-weight:1000;font-size:70px;letter-spacing:-0.045em;color:var(--ink)">Hai Pantai</div>
      </div>
      ${[["01", "Snap the trash.", "Claude vision tags the type and size"], ["02", "Clean it up.", "Before and after, checked by Claude"], ["03", "Win the beach.", "The cleanest beach tops the league"]]
        .map(([n, t, s], i) => `<div class="abs" id="pr-s${i}" style="left:0;right:0;top:392px;text-align:center"><div class="hl pr-st" style="font-size:86px;color:var(--ink)"><span class="coral">${n}</span> ${t}</div><div class="body pr-sb" style="font-size:34px;margin-top:10px">${s}</div></div>`).join("")}
      <div class="abs" id="pr-phone" style="left:340px;top:612px;width:400px;height:830px;transform-origin:50% 0">${phoneHTML("pp")}</div>
      <div class="abs" id="pr-scan" style="inset:0;opacity:0;background:repeating-linear-gradient(0deg, rgba(0,0,0,.25) 0 3px, transparent 3px 7px)"></div>
    </div>
    <div class="abs" id="pr-flash" style="inset:0;background:#fff"></div>`;
  const scr = $(".screen", root);
  scr.insertAdjacentHTML("beforeend", `
    <div class="scr" id="sc1" style="background:var(--sand)">
      <div class="abs" style="left:26px;top:64px;font-weight:1000;font-size:26px">New report</div>
      <div class="abs" style="right:20px;top:60px">${chip("📍 Kuta", "teal")}</div>
      <div class="abs" style="left:16px;right:16px;top:112px;height:400px;border-radius:26px;overflow:hidden;background:#cbbfa6">
        <img src="../assets/report-bottles.jpg" style="display:block;width:100%;height:100%;object-fit:cover" alt="">
        <div class="abs" id="s1-scan" style="left:0;right:0;top:0;height:90px;background:linear-gradient(rgba(94,234,212,0), rgba(94,234,212,.5));border-bottom:4px solid #5eead4"></div>
        ${boxes}
        <div class="abs" style="left:12px;top:12px"><span class="chip" id="s1-cl" style="background:rgba(255,255,255,.94)">✨ Claude is looking…</span></div>
      </div>
      <div class="abs" id="s1-chips" style="left:16px;top:530px;display:flex;gap:8px">${chip("🍾 Bottles", "on")}${chip("Size L", "amber")}${chip("10 × size", "teal")}</div>
      <div class="abs card" style="left:16px;right:16px;top:584px;height:98px;padding:16px 20px;display:flex;align-items:center;gap:16px">
        <div style="width:58px;height:58px;border-radius:18px;background:var(--sea);display:grid;place-items:center">${pinSVG("new")}</div>
        <div><div style="font-weight:900;font-size:20px">Kuta beach</div><div style="font-weight:700;font-size:15px;color:var(--muted-ink)">Pin snapped to the coast</div></div>
      </div>
      <div class="abs btn coral" style="left:16px;right:16px;top:704px">Submit report</div>
      <div class="abs" style="left:187px;top:736px">${tapHTML("s1-tap")}</div>
      <div class="toast" id="s1-toast"><div class="pts">+40</div><div><div style="font-weight:900;font-size:18px">Report sent!</div><div class="tt">Bottles, size L</div></div></div>
    </div>
    <div class="scr" id="sc2" style="background:var(--sand)">
      <div class="abs" style="left:26px;top:64px;font-weight:1000;font-size:26px">Clean · Kuta</div>
      <div class="abs" style="right:20px;top:60px">${chip("🔥 Hotspot ×2", "coral")}</div>
      <div class="abs" style="left:16px;right:16px;top:112px;height:400px;border-radius:26px;overflow:hidden;background:#cbbfa6">
        <img src="../assets/report-bottles.jpg" style="display:block;width:100%;height:100%;object-fit:cover" alt="">
        <div class="abs" id="s2-clean" style="inset:0">${beachPhoto(false, "c2")}</div>
        <div class="abs" id="s2-div" style="top:0;bottom:0;left:0;width:6px;margin-left:-3px;background:#fff;box-shadow:0 0 18px rgba(0,0,0,.35)"></div>
        <div class="abs" style="right:12px;top:12px">${chip("Before")}</div>
        <div class="abs" id="s2-after" style="left:12px;top:12px">${chip("After ✨", "good")}</div>
      </div>
      <div class="abs card" style="left:16px;right:16px;top:530px;height:150px;padding:18px 22px;display:flex;align-items:center;gap:20px">
        <svg width="112" height="112" viewBox="0 0 112 112"><circle cx="56" cy="56" r="46" fill="none" stroke="#eadfc8" stroke-width="12"/>
          <circle id="s2-ring" cx="56" cy="56" r="46" fill="none" stroke="#22c55e" stroke-width="12" stroke-linecap="round" transform="rotate(-90 56 56)"/>
          <text id="s2-n" x="56" y="68" text-anchor="middle" font-family="Nunito" font-weight="1000" font-size="36" fill="#12343b">0</text></svg>
        <div><div style="font-weight:900;font-size:22px">Clean score</div><div style="font-weight:700;font-size:15px;color:var(--muted-ink);margin:2px 0 8px">Claude compares before and after</div><span id="s2-ok">${chip("✓ Verified", "good")}</span></div>
      </div>
      <div class="abs btn" style="left:16px;right:16px;top:704px">I cleaned this</div>
      <div class="toast" id="s2-toast"><div class="pts" style="color:var(--good-ink)">+220</div><div><div style="font-weight:900;font-size:18px">Hotspot cleaned!</div><div class="tt">30 × 4 × 92% × 2</div></div></div>
    </div>
    <div class="scr" id="sc3" style="background:var(--sand)">
      <div class="abs" style="left:26px;top:64px;font-weight:1000;font-size:26px">This week’s league</div>
      <div class="abs" style="right:20px;top:60px">${chip("🏆 Beaches", "amber")}</div>
      ${[1, 2, 3, 4, 5, 6].map((n, i) => `<div class="abs" style="left:18px;top:${126 + i * 92}px;width:40px;height:78px;display:grid;place-items:center;font-weight:1000;font-size:26px;color:var(--muted-ink)">${n}</div>`).join("")}
      ${LEAGUE.map(([n, v], i) => `<div class="abs card lg-row" style="left:62px;right:16px;top:126px;height:78px;padding:12px 18px">
          <div style="display:flex;justify-content:space-between;font-weight:900;font-size:21px"><span>${n}</span><span>${v}</span></div>
          <div style="height:10px;border-radius:5px;background:var(--muted);margin-top:10px"><div style="height:100%;width:${v}%;border-radius:5px;background:${healthColor(v)}"></div></div></div>`).join("")}
      <div class="abs card" id="lg-kuta" style="left:62px;right:16px;top:126px;height:78px;padding:12px 18px;border-color:var(--teal);box-shadow:0 10px 30px rgba(14,159,154,.25)">
        <div style="display:flex;justify-content:space-between;font-weight:1000;font-size:21px"><span>Kuta <span id="lg-crown" style="display:inline-block">👑</span></span><span id="lg-v">55</span></div>
        <div style="height:10px;border-radius:5px;background:var(--muted);margin-top:10px"><div id="lg-bar" style="height:100%;width:55%;border-radius:5px"></div></div></div>
      <div class="toast" id="s3-toast" style="top:auto;bottom:26px"><div class="pts" style="font-size:30px">👑</div><div><div style="font-weight:900;font-size:18px">Kuta takes #1</div><div class="tt">Health 35 → 95 after cleanups</div></div></div>
    </div>`);
  markAnim($("#pm2", root), 50, 0);
  split($("#pr-word", root), "char"); split($("#pr-tag", root)); split($("#pr-eb", root));
  $$(".pr-st", root).forEach((e) => split(e));
  root.__rows = $$(".lg-row", root);
}, (u, root) => {
  op($("#pr-flash", root), 1 - ease(u, 0, 0.35));
  // logo lockup, then it leaves
  markAnim($("#pm", root), u, -0.05);
  const lockOut = ease(u, 1.35, 1.75, E.inCubic);
  rise($("#pr-eb", root), u, 0.15, { dist: 40 });
  rise($("#pr-word", root), u, 0.3, { stagger: 0.03, dist: 200 });
  rise($("#pr-tag", root), u, 0.65, { stagger: 0.05, dist: 90 });
  tf($("#pr-lock", root), { y: -lockOut * 260, s: 1 - lockOut * 0.25, o: 1 - lockOut, blur: lockOut * 10, origin: "540px 700px" });
  const hk = spring(u - 1.5, 12, 8);
  tf($("#pr-head", root), { y: (1 - hk) * -60, o: clamp((u - 1.5) * 5) });
  // the phone
  const pk = u < 1.45 ? 0 : spring(u - 1.45, 9, 7.5);
  tf($("#pr-phone", root), { y: (1 - pk) * 1400, s: 1.3, r: (1 - pk) * 8 + Math.sin(u * 1.3) * 0.6 });
  // step labels
  const steps = [[1.75, 3.28], [3.3, 4.78], [4.8, 6.4]];
  steps.forEach(([a, b], i) => {
    const el = $(`#pr-s${i}`, root);
    rise($(".pr-st", el), u, a, { out: b - 0.2, dist: 110, stagger: 0.04, outDur: 0.25 });
    tf($(".pr-sb", el), { y: (1 - ease(u, a + 0.12, a + 0.5)) * 30, o: Math.min(ease(u, a + 0.12, a + 0.5), 1 - ease(u, b - 0.2, b)) });
  });
  // screens slide
  const k2 = ease(u, 3.3, 3.65, E.inOutCubic), k3 = ease(u, 4.8, 5.15, E.inOutCubic);
  tf($("#sc1", root), { x: -k2 * 400 });
  tf($("#sc2", root), { x: (1 - k2) * 400 - k3 * 400 });
  tf($("#sc3", root), { x: (1 - k3) * 400 });
  // S1: Claude scans the photo
  const sk = prog(u, 1.85, 2.5);
  tf($("#s1-scan", root), { y: E.inOutSine(sk) * 360 - 60, o: sk > 0 && sk < 1 ? 1 : 0 });
  $$(".det", $("#sc1", root)).forEach((d, i) => { const k = u < 2.5 + i * 0.1 ? 0 : spring(u - 2.5 - i * 0.1, 18, 8); tf(d, { s: 0.6 + 0.4 * k, o: clamp(k * 3) }); });
  txt($("#s1-cl", root), u < 2.5 ? "✨ Claude is looking…" : "✨ Found 3 bottles");
  $$(".chip", $("#s1-chips", root)).forEach((c, i) => { const k = u < 2.82 + i * 0.1 ? 0 : spring(u - 2.82 - i * 0.1, 18, 8); tf(c, { s: k, o: clamp(k * 3) }); });
  tapAt($("#s1-tap", root), u, 3.05);
  const t1 = u < 3.12 ? 0 : spring(u - 3.12, 14, 8);
  tf($("#s1-toast", root), { y: (1 - t1) * -140, o: clamp(t1 * 3) });
  // S2: before/after wipe and the clean score
  const wk = ease(u, 3.6, 4.15, E.inOutCubic);
  css($("#s2-clean", root), "clipPath", `inset(0 ${((1 - wk) * 100).toFixed(2)}% 0 0)`);
  css($("#s2-div", root), "left", (wk * 100).toFixed(2) + "%");
  op($("#s2-div", root), wk > 0.01 && wk < 0.99 ? 1 : 0);
  op($("#s2-after", root), clamp((wk - 0.4) * 4));
  const sc = ease(u, 3.95, 4.45, E.outCubic) * 92;
  txt($("#s2-n", root), String(Math.round(sc)));
  const ring = $("#s2-ring", root), circ = 2 * Math.PI * 46;
  ring.style.strokeDasharray = `${(circ * sc / 100).toFixed(1)} ${circ.toFixed(1)}`;
  const okk = u < 4.4 ? 0 : spring(u - 4.4, 16, 8);
  tf($("#s2-ok", root), { s: okk, o: clamp(okk * 3) });
  const t2 = u < 4.42 ? 0 : spring(u - 4.42, 14, 8);
  tf($("#s2-toast", root), { y: (1 - t2) * -140, o: clamp(t2 * 3) });
  // S3: Kuta climbs the league
  const kk = ease(u, 5.1, 5.6, E.inOutCubic), kpos = lerp(5, 0, kk);
  root.__rows.forEach((r, i) => { const shift = clamp(i + 1 - kpos); tf(r, { y: (i + shift) * 92 }); });
  tf($("#lg-kuta", root), { y: kpos * 92, s: 1 + 0.05 * Math.sin(Math.PI * kk) });
  const kv = lerp(55, 95, ease(u, 5.1, 5.6));
  txt($("#lg-v", root), String(Math.round(kv)));
  css($("#lg-bar", root), "width", kv.toFixed(1) + "%");
  css($("#lg-bar", root), "background", healthColor(kv));
  const ck = u < 5.5 ? 0 : spring(u - 5.5, 16, 7);
  tf($("#lg-crown", root), { s: ck, r: (1 - ck) * -40 });
  const t3 = u < 5.55 ? 0 : spring(u - 5.55, 14, 8);
  tf($("#s3-toast", root), { y: (1 - t3) * 160, o: clamp(t3 * 3) });
  // freeze-frame glitch into the rewind
  const g = prog(u, 5.72, 6.0);
  const all = $("#pr-all", root);
  if (g > 0) {
    const j = Math.sin(u * 173) * 26 * g, sk2 = Math.sin(u * 91) * 6 * g;
    all.style.transform = `translate(${j.toFixed(1)}px,0) skewX(${sk2.toFixed(2)}deg) scale(${(1 + g * 0.06).toFixed(3)})`;
    all.style.filter = `hue-rotate(${(g * 140).toFixed(0)}deg) contrast(${(1 + g * 0.6).toFixed(2)}) saturate(${(1 + g).toFixed(2)})`;
    all.__t = null;
  } else if (all.style.filter) { all.style.filter = ""; all.style.transform = ""; }
  op($("#pr-scan", root), g * 1.2);
});

// =====================================================================
// 3. REWIND  9–10.5 s: "How?" and the clock spins back to 15:10
// =====================================================================
addScene("rewind", S.rewind, S.master, (root) => {
  root.innerHTML = `
    <div class="deep-bg"></div><div class="gridlines"></div>
    <div class="abs" id="rw-all" style="inset:0">
      <div class="abs" style="left:0;right:0;top:560px;text-align:center"><div class="eb coral" id="rw-eb">◀◀ Behind the scenes</div></div>
      <div class="abs" id="rw-how" style="left:0;right:0;top:630px;text-align:center">
        <div class="abs" id="rw-c1" style="left:0;right:0;top:0;font-weight:1000;font-size:310px;letter-spacing:-0.05em;line-height:1;color:#ff2d6f;mix-blend-mode:screen;opacity:.8">How?</div>
        <div class="abs" id="rw-c2" style="left:0;right:0;top:0;font-weight:1000;font-size:310px;letter-spacing:-0.05em;line-height:1;color:#22e6ff;mix-blend-mode:screen;opacity:.8">How?</div>
        <div class="abs" id="rw-c0" style="left:0;right:0;top:0;font-weight:1000;font-size:310px;letter-spacing:-0.05em;line-height:1;color:#fff">How?</div>
      </div>
      <div class="abs mono" id="rw-clock" style="left:0;right:0;top:1040px;text-align:center;font-weight:800;font-size:150px;color:var(--sun);letter-spacing:-0.04em;text-shadow:0 0 50px rgba(255,210,122,.4)">16:09:36</div>
      <div class="abs body" id="rw-sub" style="left:0;right:0;top:1220px;text-align:center;color:rgba(255,255,255,.72);font-size:42px">Rewind to the first commit.</div>
    </div>
    <div class="scanlines"></div>`;
}, (v, root) => {
  const k = v < 0.02 ? 0 : spring(v - 0.02, 16, 7);
  tf($("#rw-how", root), { s: 1.6 - 0.6 * k, o: clamp(v * 10), origin: "540px 150px" });
  const gl = Math.max(0, 1 - v * 2.2) * 26 + (Math.sin(v * 40) > 0.85 ? 14 : 0);
  tf($("#rw-c1", root), { x: -gl - 4, y: Math.sin(v * 77) * gl * 0.3 });
  tf($("#rw-c2", root), { x: gl + 4, y: Math.cos(v * 63) * gl * 0.3 });
  op($("#rw-eb", root), clamp((v - 0.15) * 6) * (Math.sin(v * 30) > -0.5 ? 1 : 0.4));
  const ck = ease(v, 0.42, 1.12, E.inOutCubic);
  const c = lerp(TL.COMMITS[TL.COMMITS.length - 1].sec, TL.COMMITS[0].sec, ck);
  txt($("#rw-clock", root), fmtClock(c));
  const spin = Math.sin(Math.PI * ck);
  tf($("#rw-clock", root), { y: (1 - ease(v, 0.3, 0.55)) * 60 + Math.sin(v * 120) * spin * 6, o: ease(v, 0.3, 0.5), blur: spin * 3 });
  tf($("#rw-sub", root), { y: (1 - ease(v, 0.5, 0.85)) * 30, o: ease(v, 0.5, 0.85) });
  // out: the clock flies into the HUD
  const ko = ease(v, 1.18, 1.5, E.inCubic);
  tf($("#rw-all", root), { y: -ko * 120, o: 1 - ko, blur: ko * 6 });
});

// =====================================================================
// 4. MASTER  10.5–13 s: Fable 5.2 takes the prompt and plans 10 tasks
// =====================================================================
const TASKS = ["Scaffold repo", "Coast + beaches", "Game rules", "API + Claude vision", "Seed data", "Web shell", "Map + satellite", "Report & clean", "League & profile", "Deploy kit"];
addScene("master", S.master, S.swarm, (root) => {
  root.innerHTML = `
    <div class="deep-bg"></div><div class="gridlines"></div>
    <div class="abs" style="left:80px;top:290px;width:920px">
      <div class="eb glow" id="ms-eb">01 · The brain</div>
      <div class="hl white" id="ms-h" style="margin-top:20px">One master <span class="sun">session.</span></div>
    </div>
    <div class="abs" id="ms-card" style="left:70px;top:560px;width:940px;border-radius:42px;padding:40px 42px 44px;background:linear-gradient(180deg, rgba(255,210,122,.09), rgba(255,255,255,.02));border:2px solid rgba(255,210,122,.5);box-shadow:0 0 140px rgba(255,210,122,.14), inset 0 0 60px rgba(255,210,122,.05)">
      <div style="display:flex;align-items:center;gap:24px">
        <div id="ms-orb" style="width:80px;height:80px;border-radius:50%;background:radial-gradient(circle at 35% 35%, #fff7d6, #ffd27a 45%, #f59e0b 100%);box-shadow:0 0 50px rgba(255,210,122,.75)"></div>
        <div><div style="font-weight:1000;font-size:60px;line-height:1;color:var(--sun);letter-spacing:-0.03em">Fable 5.2</div>
          <div class="mono" style="font-size:21px;color:rgba(255,255,255,.6);margin-top:8px;letter-spacing:.08em">MASTER SESSION · PLANS + DISPATCHES</div></div>
      </div>
      <div class="mono" style="margin-top:32px;padding:24px 28px;border-radius:24px;background:rgba(0,0,0,.38);border:1px solid rgba(255,255,255,.08);font-size:33px;line-height:1.5;color:#fff;height:154px">
        <div><span id="ms-p1"></span><span class="ms-cur" id="ms-c1">▌</span></div><div class="sun"><span id="ms-p2"></span><span class="ms-cur" id="ms-c2">▌</span></div></div>
      <div class="mono" id="ms-pl" style="margin-top:30px;font-size:22px;letter-spacing:.14em;color:var(--teal-glow)">PLAN · 10 TASKS → OPUS 5.5 EXECUTORS</div>
      <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px 16px">
        ${TASKS.map((t) => `<div class="mono ms-t" style="display:flex;align-items:center;gap:12px;font-size:24px;font-weight:600;color:#fff;padding:13px 16px;border-radius:16px;background:rgba(94,234,212,.08);border:1px solid rgba(94,234,212,.28);white-space:nowrap"><b style="color:var(--teal-glow)">→</b>${t}</div>`).join("")}
      </div>
    </div>`;
  split($("#ms-h", root));
  root.__tasks = $$(".ms-t", root);
}, (m, root) => {
  rise($("#ms-h", root), m, 0.02, { out: 2.2, dist: 110 });
  tf($("#ms-eb", root), { o: Math.min(ease(m, 0, 0.3), 1 - ease(m, 2.2, 2.4)) });
  const ck = m < 0.05 ? 0 : spring(m - 0.05, 10, 8);
  // exit: the card collapses into the master node of the swarm
  const xk = ease(m, 2.12, 2.5, E.inCubic);
  tf($("#ms-card", root), { y: (1 - ck) * 300 + xk * 160, s: (0.92 + 0.08 * ck) * (1 - xk * 0.88), o: clamp(m * 6) * (1 - xk * xk), origin: "50% 50%" });
  tf($("#ms-orb", root), { s: 1 + 0.08 * Math.sin(m * 9) });
  const P1 = "› Build a game for Bali’s trash.", P2 = "› Ship it in one hour.";
  const n1 = Math.floor(clamp((m - 0.28) / 0.6) * P1.length), n2 = Math.floor(clamp((m - 0.9) / 0.4) * P2.length);
  txt($("#ms-p1", root), P1.slice(0, n1)); txt($("#ms-p2", root), P2.slice(0, n2));
  const blink = Math.sin(m * 18) > 0 ? 1 : 0;
  op($("#ms-c1", root), m < 0.9 ? blink : 0); op($("#ms-c2", root), m >= 0.9 && m < 1.8 ? blink : 0);
  op($("#ms-pl", root), ease(m, 1.2, 1.35));
  root.__tasks.forEach((el, i) => { const a = 1.3 + i * 0.075; const k = m < a ? 0 : spring(m - a, 16, 8); tf(el, { x: (1 - k) * (i % 2 ? 60 : -60), s: 0.9 + 0.1 * k, o: clamp(k * 3) }); });
});

// =====================================================================
// 5. SWARM  13–17.5 s: 50+ nested Opus 5.5 sessions spawn and work in parallel
// =====================================================================
const LANES = ["Assets", "Backend", "Game rules", "Satellite map", "Trash AI", "Polygons", "Web app", "Deploy"];
const SW = { cx: 540, cy: 1040, r1: 250, r2: 404 };
addScene("swarm", S.swarm, S.agents, (root) => {
  const r = rng(11);
  const order = [...Array(48).keys()].sort(() => r() - 0.5);
  root.__leaves = [...Array(48)].map((_, n) => ({ lane: Math.floor(n / 6), j: n % 6, ts: 0.85 + order[n] * 0.036, ph: r(), per: 0.9 + r() * 0.5, tag: [3, 10, 19, 26, 34, 45].includes(n) }));
  root.__rate = LANES.map(() => 0.28 + r() * 0.3);
  root.innerHTML = `
    <div class="deep-bg"></div><div class="gridlines"></div>
    <div class="abs" style="left:80px;top:290px;width:920px">
      <div class="eb glow" id="sw-eb">02 · The swarm</div>
      <div class="hl white" id="sw-h" style="margin-top:20px">It spawns <span class="sun">50+</span> nested sessions.</div>
    </div>
    <div class="abs" id="sw-cam" style="inset:0">
      <svg class="abs" style="left:0;top:0" width="1080" height="1920">
        <defs><radialGradient id="sw-halo"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
          <radialGradient id="sw-lh"><stop offset="0" stop-color="#5eead4" stop-opacity=".7"/><stop offset="1" stop-color="#5eead4" stop-opacity="0"/></radialGradient></defs>
        <circle id="sw-ring" cx="${SW.cx}" cy="${SW.cy}" r="${SW.r2}" fill="none" stroke="rgba(94,234,212,.12)" stroke-width="2" stroke-dasharray="4 10"/>
        <circle cx="${SW.cx}" cy="${SW.cy}" r="${SW.r1}" fill="none" stroke="rgba(255,210,122,.12)" stroke-width="2" stroke-dasharray="4 10"/>
        <g id="sw-e1" stroke="rgba(255,210,122,.75)" stroke-width="3.5" stroke-linecap="round">${LANES.map(() => `<line/>`).join("")}</g>
        <g id="sw-e2" stroke="rgba(94,234,212,.4)" stroke-width="2.2" stroke-linecap="round">${root.__leaves.map(() => `<line/>`).join("")}</g>
        <g id="sw-pk" fill="#fff">${root.__leaves.map(() => `<circle r="4.5"/>`).join("")}</g>
        <g id="sw-lh">${root.__leaves.map(() => `<circle r="30" fill="url(#sw-lh)"/>`).join("")}</g>
        <g id="sw-lv">${root.__leaves.map(() => `<circle r="0" fill="#0e9f9a" stroke="#5eead4" stroke-width="3"/>`).join("")}</g>
        <circle id="sw-halo-c" cx="${SW.cx}" cy="${SW.cy}" r="190" fill="url(#sw-halo)"/>
      </svg>
      ${LANES.map((n) => `<div class="lane"><div class="bar"></div><span>${n}</span></div>`).join("")}
      ${root.__leaves.filter((l) => l.tag).map(() => `<div class="leaf-tag mono">opus 5.5</div>`).join("")}
      <div class="abs" id="sw-master" style="left:${SW.cx - 78}px;top:${SW.cy - 78}px;width:156px;height:156px;border-radius:50%;display:grid;place-items:center;text-align:center;
        background:radial-gradient(circle at 35% 30%, #fff7d6, #ffd27a 45%, #f59e0b 100%);box-shadow:0 0 80px rgba(255,210,122,.7);color:#3a2600;font-weight:1000;font-size:30px;line-height:1">Fable<br>5.2</div>
    </div>
    <div class="abs" id="sw-count" style="left:0;right:0;top:1470px;text-align:center">
      <div style="display:inline-flex;align-items:baseline;gap:18px"><span class="mono" id="sw-n" style="font-weight:800;font-size:100px;color:var(--sun);letter-spacing:-0.05em">1</span><span style="font-weight:1000;font-size:44px;color:#fff">sessions live</span></div>
      <div class="body" style="color:rgba(255,255,255,.7);font-size:32px;margin-top:2px">Fable 5.2 plans · <span class="glow">Opus 5.5</span> executes</div>
    </div>`;
  split($("#sw-h", root));
  root.__l1 = $$("#sw-e1 line", root); root.__l2 = $$("#sw-e2 line", root);
  root.__pk = $$("#sw-pk circle", root); root.__lv = $$("#sw-lv circle", root); root.__lh = $$("#sw-lh circle", root);
  root.__lanes = $$(".lane", root); root.__tags = $$(".leaf-tag", root);
}, (s, root) => {
  rise($("#sw-h", root), s, 0.05, { out: 4.0, dist: 110, stagger: 0.05 });
  tf($("#sw-eb", root), { o: Math.min(ease(s, 0, 0.3), 1 - ease(s, 4.0, 4.2)) });
  const rot = s * 5;
  const deg = Math.PI / 180;
  const at = (rad, a) => [SW.cx + rad * Math.cos(a * deg), SW.cy + rad * Math.sin(a * deg)];
  const setL = (ln, x1, y1, x2, y2) => { ln.setAttribute("x1", x1.toFixed(1)); ln.setAttribute("y1", y1.toFixed(1)); ln.setAttribute("x2", x2.toFixed(1)); ln.setAttribute("y2", y2.toFixed(1)); };
  // master
  const mk = s < 0 ? 0 : spring(s, 14, 6);
  tf($("#sw-master", root), { s: (0.3 + 0.7 * mk) * (1 + 0.04 * Math.sin(s * 8)) });
  $("#sw-halo-c", root).setAttribute("r", (190 + 30 * Math.sin(s * 5)).toFixed(1));
  // lanes
  const LP = LANES.map((_, i) => {
    const a = -90 + i * 45 + rot, p = at(SW.r1, a);
    const t0 = 0.2 + i * 0.06, ek = ease(s, t0, t0 + 0.3, E.outCubic);
    setL(root.__l1[i], SW.cx, SW.cy, lerp(SW.cx, p[0], ek), lerp(SW.cy, p[1], ek));
    const el = root.__lanes[i];
    if (!el.__w) el.__w = el.offsetWidth;
    const pk = s < t0 + 0.25 ? 0 : spring(s - t0 - 0.25, 16, 8);
    tf(el, { x: p[0] - el.__w / 2, y: p[1] - 26, s: pk, o: clamp(pk * 3) });
    const bk = clamp((s - 1.0) * root.__rate[i]);
    css($(".bar", el), "width", (bk * 100).toFixed(1) + "%");
    return { a, p };
  });
  // leaves
  let spawned = 0, tagI = 0;
  root.__leaves.forEach((L, n) => {
    const lane = LP[L.lane];
    const a = lane.a + (L.j - 2.5) * 7.2, rad = SW.r2 + (L.j % 2 ? 24 : -8);
    const p = at(rad, a);
    const ek = ease(s, L.ts - 0.16, L.ts, E.outCubic);
    setL(root.__l2[n], lane.p[0], lane.p[1], lerp(lane.p[0], p[0], ek), lerp(lane.p[1], p[1], ek));
    const k = s < L.ts ? 0 : spring(s - L.ts, 18, 7);
    if (s >= L.ts) spawned++;
    const c = root.__lv[n];
    c.setAttribute("cx", p[0].toFixed(1)); c.setAttribute("cy", p[1].toFixed(1));
    const act = 0.5 + 0.5 * Math.sin(s * 9 + L.ph * 20);
    c.setAttribute("r", (k * (12 + act * 2)).toFixed(2));
    c.setAttribute("fill", mixHex("#0e9f9a", "#5eead4", act * 0.7));
    const hc = root.__lh[n];
    hc.setAttribute("cx", p[0].toFixed(1)); hc.setAttribute("cy", p[1].toFixed(1)); hc.setAttribute("opacity", (k * (0.3 + act * 0.5)).toFixed(2));
    // data packet: master -> lane -> leaf, on a loop
    const pc = root.__pk[n];
    if (s > L.ts + 0.1) {
      const ph = ((s - L.ts) / L.per + L.ph) % 1;
      const q = ph < 0.45 ? [SW.cx, SW.cy, lane.p[0], lane.p[1], ph / 0.45] : [lane.p[0], lane.p[1], p[0], p[1], (ph - 0.45) / 0.55];
      pc.setAttribute("cx", lerp(q[0], q[2], q[4]).toFixed(1)); pc.setAttribute("cy", lerp(q[1], q[3], q[4]).toFixed(1));
      pc.setAttribute("opacity", "0.9");
    } else pc.setAttribute("opacity", "0");
    if (L.tag) {
      const tg = root.__tags[tagI++];
      const vis = env(s, L.ts + 0.05, L.ts + 1.3, 0.15, 0.3);
      tf(tg, { x: p[0] + (p[0] > SW.cx ? 18 : -108), y: p[1] - 40, o: vis });
    }
  });
  const lanesOn = LANES.filter((_, i) => s >= 0.45 + i * 0.06).length;
  const n = 1 + lanesOn + spawned;
  txt($("#sw-n", root), n >= 51 ? "50+" : String(Math.min(n, 50)));
  // camera: settle in, then dive into the swarm
  const ck = s < 0 ? 0 : spring(s, 8, 7);
  const dive = ease(s, 4.05, 4.5, E.inCubic);
  tf($("#sw-cam", root), { s: (0.85 + 0.15 * ck) * (1 + dive * 2.4), o: 1 - dive, blur: dive * 10, origin: `${SW.cx}px ${SW.cy}px` });
  tf($("#sw-count", root), { y: (1 - ease(s, 0.3, 0.7)) * 40, o: Math.min(ease(s, 0.3, 0.7), 1 - ease(s, 4.0, 4.3)) });
});

// =====================================================================
// 6. AGENTS  17.5–21 s: managed agents trace satellite polygons and type trash, side by side
// =====================================================================
addScene("agents", S.agents, S.humans, (root) => {
  const r = rng(5);
  const sat = ["#1f3d2b", "#29462d", "#344a2a", "#2b3f2c", "#3d4b32", "#24392e", "#41502f", "#1c352a"];
  const villages = GEO.villages.map((v) => `<path d="${v.d}" fill="${sat[Math.floor(r() * sat.length)]}"/>`).join("");
  const boxes = REAL_BOXES.map((b) => `<div class="det" style="left:${b.x}%;top:${b.y}%;width:${b.w}%;height:${b.h}%"><i>${b.label.split(" · ")[1]}</i></div>`).join("");
  const MW = 940, MH = Math.round(940 * GH / GW);
  root.innerHTML = `
    <div class="deep-bg"></div><div class="gridlines"></div>
    <div class="abs" style="left:80px;top:290px;width:920px">
      <div class="eb glow" id="ag-eb">03 · Managed agents</div>
      <div class="hl white" id="ag-h" style="margin-top:20px">Both <span class="glow">at once.</span></div>
    </div>
    <div class="panel" id="ag-pa" style="left:50px;top:470px;width:980px;height:${MH + 70}px">
      <div class="ph mono"><div class="ag"><span style="color:var(--teal-glow)">●</span>agent · satellite → polygons</div><div class="st" id="ag-sa">running</div></div>
      <svg class="abs" style="left:20px;top:56px" width="${MW}" height="${MH}" viewBox="0 0 ${GW} ${GH}">
        <defs>
          <clipPath id="ag-ca"><rect id="ag-ra" x="0" y="0" width="0" height="${GH}"/></clipPath>
          <clipPath id="ag-cb"><rect id="ag-rb" x="0" y="0" width="0" height="${GH}"/></clipPath>
          <filter id="ag-noise"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="2" seed="4"/><feColorMatrix type="saturate" values="0"/></filter>
          <linearGradient id="ag-sg" x1="1" x2="0"><stop offset="0" stop-color="#5eead4" stop-opacity=".55"/><stop offset="1" stop-color="#5eead4" stop-opacity="0"/></linearGradient>
        </defs>
        <rect width="${GW}" height="${GH}" fill="#04191b"/>
        <g opacity=".95">${villages}</g>
        <rect width="${GW}" height="${GH}" filter="url(#ag-noise)" opacity=".22" style="mix-blend-mode:overlay"/>
        <g clip-path="url(#ag-ca)"><path d="${LAND_D}" fill="rgba(94,234,212,.12)" stroke="#5eead4" stroke-width="1.8"/></g>
        <g clip-path="url(#ag-cb)" fill="none" stroke="#ffd27a" stroke-width="7" stroke-linecap="round">${COASTS}</g>
        <rect id="ag-sw" x="0" y="0" width="160" height="${GH}" fill="url(#ag-sg)"/>
        <rect id="ag-sl" x="0" y="0" width="6" height="${GH}" fill="#c9fff4"/>
      </svg>
      <div class="abs mono" style="left:24px;bottom:18px;display:flex;gap:12px">
        <div style="background:rgba(2,16,18,.85);border-radius:14px;padding:8px 16px;color:#fff;font-size:24px;font-weight:700"><b id="ag-v" style="color:var(--teal-glow)">0</b> village polygons</div>
        <div style="background:rgba(2,16,18,.85);border-radius:14px;padding:8px 16px;color:#fff;font-size:24px;font-weight:700"><b id="ag-b" style="color:var(--sun)">0</b> beaches</div>
      </div>
    </div>
    <div class="panel" id="ag-pb" style="left:50px;top:${470 + MH + 90}px;width:980px;height:${1590 - (470 + MH + 90)}px">
      <div class="ph mono"><div class="ag"><span style="color:var(--sun)">●</span>agent · photo → trash type</div><div class="st" id="ag-sb">running</div></div>
      <div class="abs" style="left:24px;top:80px;width:330px;bottom:24px;border-radius:22px;overflow:hidden;background:#cbbfa6">
        <img src="../assets/report-bottles.jpg" style="display:block;width:100%;height:100%;object-fit:cover" alt="">
        <div class="abs" id="ag-beam" style="left:0;right:0;top:0;height:70px;background:linear-gradient(rgba(255,210,122,0), rgba(255,210,122,.5));border-bottom:4px solid var(--sun)"></div>
        ${boxes}
      </div>
      <div class="abs" style="left:384px;right:30px;top:86px">
        <div class="cls">${[["Bottles", 0.97], ["Plastic bag", 0.21], ["Fishing net", 0.06]].map(([n, v]) => `<div class="ag-c" data-v="${v}" style="margin-bottom:14px"><div class="nm"><span>${n}</span><b>0.00</b></div><div class="tr"><div class="fl"></div></div></div>`).join("")}</div>
        <div id="ag-res" style="display:flex;gap:10px;margin-top:8px">${chip("Type · Bottles", "on")}${chip("Size · L", "amber")}${chip("+40 pts", "good")}</div>
      </div>
    </div>`;
  split($("#ag-h", root));
  $$("#ag-res .chip", root).forEach((c) => { c.style.height = "44px"; c.style.fontSize = "21px"; c.style.padding = "0 16px"; });
  root.__cls = $$(".ag-c", root); root.__det = $$(".det", root); root.__res = $$("#ag-res .chip", root);
}, (a, root) => {
  rise($("#ag-h", root), a, 0.02, { out: 3.15, dist: 110, stagger: 0.05 });
  tf($("#ag-eb", root), { o: Math.min(ease(a, 0, 0.3), 1 - ease(a, 3.15, 3.35)) });
  const ki = (d) => (a < d ? 0 : spring(a - d, 10, 8));
  const out = ease(a, 3.15, 3.5, E.inCubic);
  tf($("#ag-pa", root), { x: (1 - ki(0)) * -1100 - out * 1100, o: 1 });
  tf($("#ag-pb", root), { x: (1 - ki(0.1)) * 1100 + out * 1100, o: 1 });
  // satellite sweep
  const ka = ease(a, 0.35, 2.15, E.inOutSine), kb = ease(a, 0.75, 2.4, E.inOutSine);
  $("#ag-ra", root).setAttribute("width", (GW * ka).toFixed(1));
  $("#ag-rb", root).setAttribute("width", (GW * kb).toFixed(1));
  const sx = GW * ka;
  $("#ag-sl", root).setAttribute("x", (sx - 3).toFixed(1)); $("#ag-sw", root).setAttribute("x", (sx - 160).toFixed(1));
  const sv = ka > 0.001 && ka < 0.999 ? 1 : 0;
  $("#ag-sl", root).setAttribute("opacity", sv); $("#ag-sw", root).setAttribute("opacity", sv);
  txt($("#ag-v", root), fmt(716 * ka)); txt($("#ag-b", root), fmt(173 * kb));
  // trash typing
  const bk = prog(a, 0.35, 1.05);
  tf($("#ag-beam", root), { y: E.inOutSine(bk) * 300 - 50, o: bk > 0 && bk < 1 ? 1 : 0 });
  root.__det.forEach((d, i) => { const k = ki(1.05 + i * 0.15); tf(d, { s: 0.5 + 0.5 * k, o: clamp(k * 3) }); });
  root.__cls.forEach((c, i) => {
    const v = +c.dataset.v, k = ease(a, 1.3 + i * 0.08, 2.0 + i * 0.08, E.outCubic);
    css($(".fl", c), "width", (v * k * 100).toFixed(1) + "%"); txt($("b", c), (v * k).toFixed(2));
  });
  root.__res.forEach((c, i) => { const k = ki(2.05 + i * 0.1); tf(c, { s: k, o: clamp(k * 3) }); });
  // statuses
  const done = (el, at) => { const ok = a >= at; txt(el, ok ? "done ✓" : "running" + ".".repeat(1 + Math.floor(a * 6) % 3)); el.classList.toggle("ok", ok); };
  done($("#ag-sa", root), 2.6); done($("#ag-sb", root), 2.4);
});

// =====================================================================
// 7. HUMANS  21–24.5 s: the team names it, draws the logo and drops features into live sessions
// =====================================================================
const FEATS = ["＋ Workshop tab", "＋ 中文 · Bahasa", "＋ Share cards", "＋ Dark mode"];
addScene("humans", S.humans, S.github, (root) => {
  root.innerHTML = `
    <div class="abs" id="hu-bg" style="inset:0;background:var(--sand)">
      <div class="abs" style="inset:0;background:radial-gradient(70% 50% at 50% 40%, #fff, rgba(255,255,255,0))"></div>
      <div class="abs" id="hu-all" style="inset:0">
        <div class="abs" style="left:80px;top:290px;width:920px">
          <div class="eb coral" id="hu-eb">04 · Meanwhile, the humans</div>
          <div class="hl" id="hu-h" style="margin-top:20px;color:var(--ink)">Name, logo, features. <span style="color:var(--teal)">On the fly.</span></div>
        </div>
        <div class="abs card" id="hu-card" style="left:60px;top:580px;width:960px;height:300px;border-radius:38px;box-shadow:0 30px 60px -30px rgba(18,52,59,.35)">
          <div class="eb" style="position:absolute;left:46px;top:38px;font-size:22px;color:var(--muted-ink)">App name</div>
          <div class="abs" id="hu-old" style="left:46px;top:100px;font-weight:1000;font-size:96px;letter-spacing:-0.045em;line-height:1.15;color:var(--muted-ink);white-space:nowrap">
            <span id="hu-oldt"></span><span id="hu-cur" style="color:var(--teal);font-weight:400">|</span>
            <div class="abs" id="hu-strike" style="left:-6px;top:58px;height:12px;width:0;background:var(--coral);border-radius:6px"></div></div>
          <div class="abs" id="hu-new" style="left:46px;top:100px;font-weight:1000;font-size:104px;letter-spacing:-0.045em;line-height:1.1;color:var(--ink);white-space:nowrap">Hai Pantai</div>
          <div class="abs" id="hu-markw" style="left:735px;top:55px;width:190px;height:190px">${markSVG("hm")}</div>
        </div>
        <div class="abs eb" id="hu-fl" style="left:80px;top:940px;font-size:22px;color:var(--muted-ink)">Feature requests, mid-build</div>
        ${FEATS.map((f, i) => `<div class="abs hu-chip" style="left:${60 + (i % 2) * 490}px;top:${990 + Math.floor(i / 2) * 112}px;width:470px;height:92px;border-radius:28px;background:#fff;border:3px solid var(--border);box-shadow:0 14px 30px -14px rgba(18,52,59,.35);display:flex;align-items:center;padding:0 28px;font-weight:1000;font-size:38px;letter-spacing:-0.02em;color:var(--ink);white-space:nowrap">${f}</div>`).join("")}
        <div class="abs" id="hu-bar" style="left:60px;top:1260px;width:960px;height:250px;border-radius:38px;background:#062a2e;box-shadow:0 30px 60px -30px rgba(6,42,46,.6)">
          <div class="abs mono" style="left:34px;top:26px;font-size:21px;letter-spacing:.12em;color:rgba(255,255,255,.55)">RUNNING SESSIONS · OPUS 5.5</div>
          ${[...Array(12)].map((_, i) => `<div class="abs hu-dot" style="left:${52 + i * 76}px;top:94px;width:56px;height:56px;border-radius:50%;background:#0e9f9a;border:4px solid #5eead4"></div>`).join("")}
          <div class="abs" style="left:34px;top:178px;font-weight:800;font-size:28px;color:rgba(255,255,255,.78)">Features land in sessions that never stopped.</div>
        </div>
      </div>
    </div>`;
  split($("#hu-h", root)); split($("#hu-new", root), "char");
  root.__chips = $$(".hu-chip", root); root.__dots = $$(".hu-dot", root);
}, (g, root) => {
  // entry: a sand circle opens over the dark swarm
  const wk = ease(g, -0.32, 0.02, E.inOutCubic);
  css($("#hu-bg", root), "clipPath", wk >= 1 ? "none" : `circle(${(wk * 2300).toFixed(0)}px at 540px 1040px)`);
  rise($("#hu-h", root), g, 0.05, { dist: 110, stagger: 0.05 });
  op($("#hu-eb", root), ease(g, 0, 0.3));
  const ck = g < 0.02 ? 0 : spring(g - 0.02, 11, 8);
  tf($("#hu-card", root), { y: (1 - ck) * 120, o: clamp(ck * 3) });
  // the name changes
  const OLD = "Pantai League", n = Math.floor(clamp((g - 0.18) / 0.55) * OLD.length);
  txt($("#hu-oldt", root), OLD.slice(0, n));
  op($("#hu-cur", root), g < 0.95 && Math.sin(g * 18) > 0 ? 1 : 0);
  css($("#hu-strike", root), "width", (ease(g, 0.95, 1.12, E.outCubic) * 690).toFixed(0) + "px");
  const od = ease(g, 1.12, 1.35, E.inCubic);
  tf($("#hu-old", root), { y: od * 60, o: 1 - od, blur: od * 4 });
  rise($("#hu-new", root), g, 1.15, { stagger: 0.025, dist: 130 });
  markAnim($("#hm", root), g, 0.95);
  op($("#hu-markw", root), g > 1.1 ? 1 : 0);
  // feature chips appear, then fly into running sessions
  op($("#hu-fl", root), ease(g, 1.45, 1.7));
  const targets = [2, 5, 8, 10];
  root.__chips.forEach((c, i) => {
    const a = 1.6 + i * 0.2, f0 = 2.15 + i * 0.15;
    const k = g < a ? 0 : spring(g - a, 15, 8);
    const fk = ease(g, f0, f0 + 0.3, E.inCubic);
    const cx = 60 + (i % 2) * 490 + 235, cy = 990 + Math.floor(i / 2) * 112 + 46;
    const tx = 60 + 52 + targets[i] * 76 + 28, ty = 1260 + 94 + 28;
    tf(c, { x: (tx - cx) * fk, y: (ty - cy) * fk - Math.sin(Math.PI * fk) * 80, s: (0.6 + 0.4 * k) * (1 - fk * 0.85), r: (1 - k) * (i % 2 ? 8 : -8) + fk * 10, o: clamp(k * 3) * (1 - prog(fk, 0.8, 1)) });
  });
  const barK = g < 1.3 ? 0 : spring(g - 1.3, 10, 8);
  tf($("#hu-bar", root), { y: (1 - barK) * 200, o: clamp(barK * 3) });
  root.__dots.forEach((d, i) => {
    const hit = targets.indexOf(i), land = hit >= 0 ? 2.45 + hit * 0.15 : 99;
    const fl = g < land ? 0 : Math.exp(-(g - land) * 3.5);
    const act = 0.5 + 0.5 * Math.sin(g * 7 + i * 1.7);
    css(d, "background", g >= land ? mixHex("#ffd27a", "#f59e0b", 1 - fl) : mixHex("#0e9f9a", "#2bc4b4", act));
    css(d, "borderColor", g >= land ? "#fff7d6" : "#5eead4");
    tf(d, { s: 1 + fl * 0.45 + act * 0.05 });
  });
  // out
  const out = ease(g, 3.15, 3.5, E.inCubic);
  tf($("#hu-all", root), { y: -out * 160, o: 1 - out });
});

// =====================================================================
// 8. GITHUB  24.5–27.5 s: the real commit feed and the hour, minute by minute
// =====================================================================
const GH_GREENS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
addScene("github", S.github, S.finale, (root) => {
  root.innerHTML = `
    <div class="abs" id="gh-bg" style="inset:0;background:radial-gradient(100% 70% at 50% 30%, #0d1117, #010409)">
      <div class="abs" style="left:80px;top:290px;width:920px">
        <div class="eb" id="gh-eb" style="color:#7d8590">05 · On GitHub, live</div>
        <div class="hl white" style="margin-top:20px;font-size:96px"><span class="mono" id="gh-c" style="letter-spacing:-0.07em">16</span> commits.<br><span class="mono" id="gh-p" style="color:#a371f7;letter-spacing:-0.07em">2</span> PRs merged.</div>
      </div>
      <div class="gh" id="gh-feed" style="left:50px;top:540px;width:980px;height:760px">
        <div class="abs" style="left:0;right:0;top:0;height:76px;display:flex;align-items:center;gap:14px;padding:0 26px;background:#161b22;border-bottom:1px solid #30363d">
          ${GH_MARK}<span class="mono" style="color:#e6edf3;font-size:25px;font-weight:700">Team7-SEA</span><span class="mono" style="color:#7d8590;font-size:23px">· main</span>
          <span style="flex:1"></span><span class="mono" id="gh-now" style="color:var(--sun);font-size:25px;font-weight:700">15:56</span></div>
        <div class="abs" style="left:0;right:0;top:76px;bottom:0;overflow:hidden">
          ${TL.COMMITS.map((c) => `<div class="gh-row mono${c.pr ? " merge" : ""}"><span class="h">${c.hash}</span><span class="m">${c.msg}</span>${c.pr ? `<span class="pr">Merged #${c.pr}</span>` : ""}<span class="w">${c.wita.slice(0, 5)}</span></div>`).join("")}
        </div>
      </div>
      <div class="abs" id="gh-gw" style="left:50px;top:1336px;width:980px;height:200px">
        <div class="mono" style="font-size:21px;letter-spacing:.14em;color:#7d8590;display:flex;justify-content:space-between"><span>THE HOUR, MINUTE BY MINUTE</span><span>15:10 → 16:10</span></div>
        ${[...Array(60)].map((_, m) => `<div class="cell" style="left:${(m % 20) * 49}px;top:${44 + Math.floor(m / 20) * 49}px"></div>`).join("")}
      </div>
    </div>`;
  root.__rows = $$(".gh-row", root); root.__cells = $$(".cell", root);
  root.__min = TL.COMMITS.map((c) => Math.min(59, Math.floor((c.sec - TL.COMMITS[0].sec) / 60)));
}, (k, root, t) => {
  // entry: wipe up from the bottom
  const wk = ease(k, -0.35, 0, E.inOutCubic);
  css($("#gh-bg", root), "clipPath", wk >= 1 ? "none" : `inset(${((1 - wk) * 100).toFixed(2)}% 0 0 0)`);
  op($("#gh-eb", root), ease(k, 0, 0.3));
  const C = TL.COMMITS, N = C.length;
  const arrived = C.map((c) => c.t <= t);
  // rows: newest on top, each later commit pushes older rows down one slot
  const pos = new Array(N).fill(0);
  for (let j = 0; j < N; j++) for (let i = j + 1; i < N; i++) pos[j] += C[i].t <= S.github ? 1 : E.outCubic(prog(t, C[i].t, C[i].t + 0.22));
  root.__rows.forEach((r, j) => {
    if (!arrived[j] || pos[j] > 9.6) { op(r, 0); return; }
    const intro = C[j].t <= S.github ? ease(k, 0.05 + pos[j] * 0.03, 0.35 + pos[j] * 0.03) : 1;
    const nk = C[j].t > S.github ? E.outCubic(prog(t, C[j].t, C[j].t + 0.25)) : 1;
    tf(r, { x: (1 - nk) * -50 + (1 - intro) * 60, y: pos[j] * 74, o: Math.min(intro, nk) });
    const flash = C[j].t > S.github ? Math.exp(-(t - C[j].t) * 4) : 0;
    css(r, "background", flash > 0.02 ? `rgba(${C[j].pr ? "137,87,229" : "56,139,253"},${(0.12 + flash * 0.3).toFixed(3)})` : C[j].pr ? "rgba(137,87,229,.12)" : "transparent");
  });
  const nC = arrived.filter(Boolean).length, nP = C.filter((c, i) => c.pr && arrived[i]).length;
  txt($("#gh-c", root), String(nC)); txt($("#gh-p", root), String(nP));
  const clk = TL.clockAt(t);
  txt($("#gh-now", root), fmtClock(clk).slice(0, 5));
  // the minute grid
  const counts = new Array(60).fill(0), last = new Array(60).fill(-9);
  C.forEach((c, i) => { if (arrived[i]) { counts[root.__min[i]]++; last[root.__min[i]] = Math.max(last[root.__min[i]], c.t); } });
  const nowM = Math.min(59, Math.floor((clk - C[0].sec) / 60));
  root.__cells.forEach((cell, m) => {
    const intro = ease(k, 0.1 + m * 0.006, 0.4 + m * 0.006);
    const pop = last[m] > S.github ? Math.exp(-(t - last[m]) * 6) : 0;
    css(cell, "background", GH_GREENS[Math.min(4, counts[m])]);
    css(cell, "outline", m === nowM ? "3px solid #58a6ff" : "none");
    tf(cell, { s: (0.6 + 0.4 * intro) * (1 + pop * 0.35), o: intro });
  });
  tf($("#gh-feed", root), { y: (1 - ease(k, 0, 0.4)) * 80, o: ease(k, 0, 0.3) });
});

// =====================================================================
// 9. FINALE  27.5–30 s: shipped
// =====================================================================
addScene("finale", S.finale, S.end, (root) => {
  root.innerHTML = `
    <div class="deep-bg"></div>
    <svg class="abs" style="left:-80px;top:1080px;width:1240px;height:771px;opacity:.55" viewBox="0 0 ${GW} ${GH}">
      <path d="${LAND_D}" fill="#0b3d42"/>
      <g id="fi-coast" fill="none" stroke-width="7" stroke-linecap="round">${COASTS}</g>
    </svg>
    <div class="abs" style="left:0;right:0;top:0;height:1300px;background:linear-gradient(#021012 50%, rgba(2,16,18,0))"></div>
    <div class="abs" id="fi-lock" style="inset:0">
      <div class="abs" style="left:0;right:0;top:330px;text-align:center"><div class="eb sun" id="fi-eb">Shipped · 16:09 WITA</div></div>
      <div class="abs" id="fi-markw" style="left:445px;top:395px;width:190px;height:190px">${markSVG("fm")}</div>
      <div class="abs" id="fi-word" style="left:0;right:0;top:610px;text-align:center;font-weight:1000;font-size:168px;letter-spacing:-0.05em;line-height:1;color:#fff">Hai Pantai</div>
      <div class="abs" id="fi-built" style="left:0;right:0;top:806px;text-align:center;font-weight:1000;font-size:72px;letter-spacing:-0.035em;color:var(--sun)">Built in 59 minutes.</div>
      <div class="abs" style="left:60px;right:60px;top:950px;display:flex;gap:18px">
        <div class="stat fi-s"><div class="n" style="color:var(--sun)">1</div><div class="l">Fable 5.2<br>master</div></div>
        <div class="stat fi-s"><div class="n" style="color:var(--teal-glow)">50+</div><div class="l">Opus 5.5<br>sessions</div></div>
        <div class="stat fi-s"><div class="n" style="color:#a371f7">29</div><div class="l">commits<br>5 PRs merged</div></div>
      </div>
      <div class="abs" id="fi-tag" style="left:0;right:0;top:1240px;text-align:center;font-weight:900;font-size:46px;color:rgba(255,255,255,.85)">Bali’s coast is the <span class="glow">scoreboard.</span></div>
      <div class="abs" id="fi-foot" style="left:0;right:0;top:1400px;text-align:center;color:rgba(255,255,255,.6)">
        <div style="font-weight:1000;font-size:46px;letter-spacing:-0.01em;color:#fff">Team7</div>
        <div style="font-weight:800;font-size:25px;margin-top:8px">ATOX × Tsinghua x-lab <span style="opacity:.5">|</span> Bali Innovation Co-Lab 10.11.26</div>
      </div>
    </div>
    <div class="abs" id="fi-stamp" style="left:0;right:0;top:740px;text-align:center">
      <span style="display:inline-block;font-weight:1000;font-size:180px;letter-spacing:-0.04em;line-height:1.1;color:var(--sun);border:14px solid var(--sun);border-radius:44px;padding:4px 54px 14px;transform:rotate(-6deg);text-shadow:0 0 60px rgba(255,210,122,.5);box-shadow:0 0 80px rgba(255,210,122,.25)">SHIPPED</span></div>
    <div class="abs" id="fi-flash" style="inset:0;background:#fff"></div>`;
  split($("#fi-word", root), "char"); split($("#fi-built", root)); split($("#fi-tag", root));
  root.__coast = $$("#fi-coast path", root); root.__stats = $$(".fi-s", root);
}, (f, root) => {
  op($("#fi-flash", root), 1 - ease(f, 0, 0.3));
  const sk = f < 0 ? 0 : spring(f, 13, 7);
  const so = ease(f, 0.55, 0.8, E.inCubic);
  tf($("#fi-stamp", root), { s: (2.2 - 1.2 * sk) * (1 - so * 0.4), o: clamp(f * 8) * (1 - so), blur: so * 8 });
  op($("#fi-eb", root), ease(f, 0.8, 1.0));
  const mk = f < 0.82 ? 0 : spring(f - 0.82, 13, 7);
  tf($("#fi-markw", root), { s: mk, r: (1 - mk) * -30 });
  markAnim($("#fm", root), 50 + f, 0);
  rise($("#fi-word", root), f, 0.9, { stagger: 0.025, dist: 180 });
  rise($("#fi-built", root), f, 1.12, { stagger: 0.05, dist: 90 });
  root.__stats.forEach((s, i) => { const k = f < 1.3 + i * 0.1 ? 0 : spring(f - 1.3 - i * 0.1, 13, 8); tf(s, { y: (1 - k) * 120, o: clamp(k * 3) }); });
  rise($("#fi-tag", root), f, 1.62, { stagger: 0.04, dist: 60 });
  tf($("#fi-foot", root), { y: (1 - ease(f, 1.8, 2.15)) * 30, o: ease(f, 1.8, 2.15) });
  tf($("#fi-lock", root), { s: 1 + f * 0.012, origin: "540px 800px" });
  // the coast turns green from west to east
  root.__coast.forEach((p) => {
    const x = +p.dataset.x / GW, k = ease(f, 0.15 + x * 1.0, 0.45 + x * 1.0);
    const v = k > 0.5 ? "#22c55e" : "#ff6b4a";
    if (p.__c !== v) { p.setAttribute("stroke", v); p.__c = v; }
    p.setAttribute("opacity", (0.5 + 0.5 * Math.sin(Math.PI * k)).toFixed(2));
  });
});

// ---------- HUD and commit ticker ----------
const hud = $("#hud"), ticker = $("#ticker");
hud.innerHTML = `<div class="row"><div class="live"><i class="dot" id="hud-dot"></i>LIVE BUILD</div><div class="clock mono"><span id="hud-clock">15:10:07</span><small>WITA</small></div></div>
  <div class="track"><div class="fill" id="hud-fill"></div></div><div class="tlabel mono" id="hud-t" style="display:none"></div>`;
ticker.innerHTML = [0, 1].map(() => `<div class="tk mono">${COMMIT_ICO}<span class="h"></span><span class="m"></span><span class="w"></span></div>`).join("");
const tks = $$(".tk", ticker);
const setTk = (el, c) => { txt($(".h", el), c ? c.hash : ""); txt($(".m", el), c ? c.msg : ""); txt($(".w", el), c ? c.wita.slice(0, 5) : ""); };
function updateHud(t) {
  const hv = env(t, 10.28, 28.15, 0.3, 0.35);
  tf(hud, { y: (1 - E.outCubic(prog(t, 10.28, 10.6))) * -40, o: hv });
  const c = TL.clockAt(t);
  txt($("#hud-clock"), fmtClock(c));
  css($("#hud-fill"), "width", (clamp((c - 607) / 3600) * 100).toFixed(2) + "%");
  op($("#hud-dot"), Math.sin(t * 6) > -0.3 ? 1 : 0.3);
  // ticker: newest commit slides in, the previous slides out
  const tv = env(t, 10.6, S.github - 0.05, 0.3, 0.3);
  op(ticker, tv);
  if (tv <= 0) return;
  let i = -1;
  TL.COMMITS.forEach((cm, j) => { if (cm.t <= t) i = j; });
  const cur = TL.COMMITS[i], prev = TL.COMMITS[i - 1];
  const k = cur ? E.outCubic(prog(t, cur.t, cur.t + 0.3)) : 0;
  setTk(tks[0], cur); setTk(tks[1], prev);
  tf(tks[0], { y: (1 - k) * 74, o: cur ? 1 : 0 });
  tf(tks[1], { y: -k * 74, o: prev ? 1 - k : 0 });
  css(ticker, "borderColor", cur && t - cur.t < 0.5 ? `rgba(94,234,212,${(0.18 + 0.6 * (1 - (t - cur.t) / 0.5)).toFixed(2)})` : "rgba(94,234,212,.18)");
}

// ---------- frame ----------
const grain = $("#grain");
const IMPACTS = [S.product, S.swarm, S.finale];
window.DURATION = TL.DURATION;
window.renderFrame = (t) => {
  for (const sc of SC) {
    const on = t >= sc.t0 - sc.pre && t < sc.t1 + sc.post;
    css(sc.root, "visibility", on ? "visible" : "hidden");
    if (on) sc.update(t - sc.t0, sc.root, t);
  }
  updateHud(t);
  let sx = 0, sy = 0;
  for (const ti of IMPACTS) if (t >= ti && t < ti + 0.6) { const a = Math.exp(-(t - ti) * 9) * 18; sx += Math.sin((t - ti) * 95) * a; sy += Math.cos((t - ti) * 77) * a; }
  tf(world, { x: sx, y: sy });
  grain.style.transform = `translate(${(Math.sin(t * 91) * 40).toFixed(0)}px,${(Math.cos(t * 77) * 40).toFixed(0)}px)`;
};
window.ready = document.fonts.ready.then(() => Promise.all([...document.images].map((im) => im.decode().catch(() => {})))).then(() => true);
const qs = new URLSearchParams(location.search);
if (qs.has("t")) window.ready.then(() => renderFrame(+qs.get("t")));
if (qs.has("play")) {
  const t0 = performance.now() - (+qs.get("play") || 0) * 1000;
  const loop = () => { renderFrame(((performance.now() - t0) / 1000) % DURATION); requestAnimationFrame(loop); };
  window.ready.then(loop);
}
