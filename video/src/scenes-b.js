// Scenes 5-7: Report, Clean, Compete.
const PH = window.VERT ? { x: 340, y: 850, s: 1 } : { x: 330, y: 125, s: 1 };           // phone position
const SW = 374, SHH = 804;                // screen size
const MV = { x: 800, y: 596, w: 300 };    // phone map viewBox (geo units)
MV.k = SW / MV.w; MV.h = SHH / MV.k;
const K = coastPoint("Kuta");             // the report's pin
const toPx = ([x, y]) => [(x - MV.x) * MV.k, (y - MV.y) * MV.k];
const KPX = toPx(K);
const MOCK = { Kuta: 55, Legian: 60, Seminyak: 75, Canggu: 80, Sanur: 90, "Sanur Kauh": 88, "Sanur Kaja": 92, Jimbaran: 70, Pecatu: 85, Kedonganan: 66, Tuban: 72, Kerobokan: 78, "Kerobokan Kelod": 74 };
const beachName = Object.fromEntries(GEO.beaches.map((b) => [b.id, b.name]));
const healthOf = (id) => { const n = beachName[id]; if (n in MOCK) return MOCK[n]; let s = 0; for (const c of id) s += c.charCodeAt(0); return 62 + (s % 35); };
const tint = (hv) => { const c = healthColor(hv); return c; };

function phoneMapSVG(id) {
  const pins = [
    ["Legian", "open"], ["Seminyak", "clean"], ["Canggu", "clean"], ["Sanur", "open"], ["Jimbaran", "hot"], ["Pecatu", "clean"], ["Sanur Kauh", "clean"], ["Kerobokan Kelod", "open"],
  ].filter(([n]) => beachByName(n)).map(([n, k], i) => { const p = coastPoint(n, i * 3 - 6); return { p, k }; });
  const pin = ({ p, k }) => `<g transform="translate(${p[0]} ${p[1]})">${k === "hot" ? `<circle r="13" fill="#ff6b4a" opacity=".22"/>` : ""}<circle r="6" fill="${k === "clean" ? "#22c55e" : "#ff6b4a"}" stroke="#fff" stroke-width="2.4"/></g>`;
  return `<svg class="mapsvg" id="${id}" viewBox="${MV.x} ${MV.y} ${MV.w} ${MV.h.toFixed(1)}" preserveAspectRatio="xMidYMid slice" style="background:#cfe9ea">
    <g class="mz">
      ${GEO.villages.map((v) => `<path d="${v.d}" class="${v.b === "kuta-badung" ? "v-kuta" : ""}" fill="${v.b ? tint(healthOf(v.b)) : "#f1e8d4"}" fill-opacity="${v.b ? 0.55 : 1}" stroke="#e0d0ae" stroke-width="0.5"/>`).join("")}
      ${GEO.beaches.map((b) => `<path d="${b.d}" fill="none" stroke="#fff" stroke-width="1.6" opacity=".9"/>`).join("")}
      ${pins.map(pin).join("")}
      <g class="kpin" transform="translate(${K[0]} ${K[1]})"><g class="kpin-in">
        <circle class="kglow" r="13" fill="#ff6b4a" opacity=".25"/><circle class="kring" r="7" fill="none" stroke="#ff6b4a" stroke-width="2"/>
        <circle class="kdot" r="6.5" fill="#ff6b4a" stroke="#fff" stroke-width="2.6"/></g></g>
    </g>
  </svg>`;
}
const bannerHTML = `<div class="abs card" style="left:16px;right:16px;top:58px;height:58px;border-radius:20px;display:flex;align-items:center;gap:10px;padding:0 14px;box-shadow:0 8px 20px rgba(18,52,59,.12)">
  <span style="font-size:24px">🏆</span><div style="flex:1;font-weight:900;font-size:15px;line-height:1.1">Clean 50 spots this week<div style="height:7px;border-radius:4px;background:var(--muted);margin-top:6px"><div style="width:64%;height:100%;border-radius:4px;background:var(--teal)"></div></div></div><span style="font-weight:1000;color:var(--teal);font-size:16px">32/50</span></div>
  <div class="abs" style="right:16px;top:128px;display:flex;background:#fff;border-radius:999px;border:2px solid var(--border);padding:3px;font-weight:900;font-size:13px"><span style="background:var(--teal);color:#fff;border-radius:999px;padding:5px 12px">Map</span><span style="padding:5px 12px;color:var(--muted-ink)">Satellite</span></div>`;

function captionsHTML(id, eyebrow, title, color, bullets) {
  return `<div class="caps" id="${id}">
    <div class="eyebrow" style="color:${color}">${eyebrow}</div>
    <div class="h1 cap-t" style="font-size:136px;margin-top:18px">${title}</div>
    <div class="bullets">${bullets.map((b, i) => `<div class="bl"><div class="n">${i + 1}</div><div>${b}</div></div>`).join("")}</div>
  </div>`;
}
function bulletsAt(root, t, times, outAt) {
  const rows = $$(".bl", root);
  rows.forEach((r, i) => {
    const a = times[i], k = spring(t - a, 12, 8);
    const active = t >= a && (i === rows.length - 1 || t < times[i + 1]);
    const out = ease(t, outAt + i * 0.05, outAt + 0.4 + i * 0.05, E.inCubic);
    tf(r, { x: (1 - k) * 80 - out * 60, o: (t >= a ? Math.min(1, (t - a) * 4) : 0) * (active ? 1 : 0.38) * (1 - out) });
    tf($(".n", r), { s: active ? 1 + 0.12 * Math.sin(Math.PI * prog(t, a, a + 0.4)) : 1 });
    css($(".n", r), "background", active ? "var(--teal)" : "var(--teal-soft)");
    css($(".n", r), "color", active ? "#fff" : "var(--teal-ink)");
  });
}
function phoneIn(el, t, a = 0) {
  const k = spring(t - a, 7, 6);
  tf(el, { x: PH.x, y: PH.y + (1 - k) * 900, r: (1 - k) * -10, s: PH.s });
}

// ---------- 5. Report it ----------
scene({
  name: "report", t0: S.report, t1: S.clean,
  build(root) {
    const bx = (window.SHORT ? REAL_BOXES.map((b) => {
      const s = Math.max(338 / 576, 230 / 384), W = 576 * s, H = 384 * s, ox = (338 - W) / 2, oy = (230 - H) / 2;
      return { x: (b.x / 100 * W + ox) / s, y: (b.y / 100 * H + oy) / s, w: b.w / 100 * W / s, h: b.h / 100 * H / s, label: b.label, s, oy: 0 };
    }) : TRASH_BOXES).map((b) => {
      const s = b.s ?? Math.max(338 / 360, 230 / 300), oy = b.oy ?? (230 - 300 * s) / 2;
      return `<div class="rbox abs" style="left:${b.x * s}px;top:${b.y * s + oy}px;width:${b.w * s}px;height:${b.h * s}px;border:3px solid #5eead4;border-radius:10px;box-shadow:0 0 0 2px rgba(0,0,0,.15)"><span style="position:absolute;left:-3px;top:-24px;background:#0e9f9a;color:#fff;font-weight:900;font-size:11px;padding:3px 7px;border-radius:7px;white-space:nowrap">${b.label}</span></div>`;
    }).join("");
    root.innerHTML = `
      <div class="abs" style="inset:0;background:var(--sand)"></div>
      <div class="abs" style="left:150px;top:90px;width:760px;height:900px;border-radius:50%;background:radial-gradient(closest-side,#e6f5f4,rgba(230,245,244,0))"></div>
      ${phoneHTML("r-phone")}
      ${captionsHTML("r-caps", "Step 01", "Report it.", "var(--coral)", [
        "Snap a photo of the trash.",
        "Claude vision tags the type and size.",
        "The pin snaps to the nearest coast.<small>One of 173 beaches, named after its village.</small>",
        "Earn <span style='color:var(--teal)'>10 × size</span> points.<small><span class='kbd'>S ×1</span> <span class='kbd'>M ×2</span> <span class='kbd'>L ×4</span> &nbsp;→ this pile is worth <b style='color:var(--teal)'>+40</b></small>",
      ])}`;
    const scr = $(".screen", root);
    scr.insertAdjacentHTML("beforeend", `
      <div class="scr" id="r-map">${phoneMapSVG("r-msvg")}${bannerHTML}
        <div class="abs btn coral" id="r-btn" style="left:18px;right:18px;bottom:104px">📷 Report trash</div>${tabbar()}
        <div class="toast" id="r-toast"><div style="font-size:40px">🎉</div><div style="flex:1"><div class="pts">+40 points</div><div class="tt">Thanks for reporting!</div></div><span class="chip amber" id="r-badge">📍 First report</span></div>
      </div>
      <div class="scr" id="r-cam" style="background:#000">
        <div class="abs" style="left:0;right:0;top:84px;height:560px">${beachPhoto(true, "rc")}</div>
        <div class="abs" style="left:0;right:0;top:600px;text-align:center;color:#fff;font-weight:800;font-size:16px;opacity:.8">Point at the trash</div>
        <div class="abs" id="r-shut" style="left:50%;bottom:58px;margin-left:-42px;width:84px;height:84px;border-radius:50%;border:5px solid #fff;padding:6px"><div style="width:100%;height:100%;border-radius:50%;background:#fff"></div></div>
        <div class="abs" id="r-flash" style="inset:0;background:#fff"></div>
      </div>
      <div class="scr" id="r-sheet" style="background:var(--sand)">
        <div class="abs" style="left:22px;right:22px;top:62px;display:flex;justify-content:space-between;align-items:center"><span style="font-weight:1000;font-size:26px">New report</span><span style="font-weight:900;font-size:22px;color:var(--muted-ink)">✕</span></div>
        <div class="abs" id="r-photo" style="left:18px;right:18px;top:108px;height:230px;border-radius:22px;overflow:hidden">
          ${beachPhoto(true, "rs")}
          <div class="abs" id="r-boxes" style="inset:0">${bx}</div>
          <div class="abs" id="r-scan" style="left:0;right:0;top:0;height:70px;background:linear-gradient(180deg,rgba(94,234,212,0),rgba(94,234,212,.5));border-bottom:3px solid #5eead4"></div>
          <div class="abs chip" id="r-ai" style="left:10px;${window.SHORT ? "top:10px" : "bottom:10px"};background:rgba(18,52,59,.85);border:none;color:#fff"><span style="color:#5eead4">✦</span><span id="r-ai-t">Claude is looking…</span></div>
        </div>
        <div class="abs" id="r-skel" style="left:18px;right:18px;top:356px">${[220, 300, 180].map((w) => `<div style="width:${w}px;height:26px;border-radius:13px;background:linear-gradient(90deg,#efe5cf,#f8f1e2,#efe5cf);margin-bottom:16px"></div>`).join("")}</div>
        <div class="abs" id="r-tags" style="left:18px;right:18px;top:352px">
          <div style="font-weight:900;font-size:13px;letter-spacing:.12em;color:var(--muted-ink)">TYPE</div>
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><span class="chip on rt">🧴 Bottles</span><span class="chip rt">🛍️ Plastic</span><span class="chip rt">🕸️ Nets</span><span class="chip rt">Mixed</span></div>
          <div style="display:flex;align-items:center;gap:12px;margin-top:12px"><div style="font-weight:900;font-size:13px;letter-spacing:.12em;color:var(--muted-ink)">SIZE</div>
            <div style="display:flex;background:#fff;border:2px solid var(--border);border-radius:14px;padding:3px;gap:3px;font-weight:1000"><span style="padding:4px 16px">S</span><span style="padding:4px 16px">M</span><span id="r-L" style="padding:4px 16px;border-radius:10px;background:var(--coral);color:#fff">L</span></div>
            <span class="chip coral rt" style="height:30px;font-size:13px">+40 pts</span></div>
          <div id="r-sum" style="margin-top:12px;font-weight:800;font-size:16px;color:var(--ink);font-style:italic;min-height:22px"></div>
        </div>
        <div class="abs card" id="r-mini" style="left:18px;right:18px;top:540px;height:118px;border-radius:20px;overflow:hidden">
          <svg viewBox="${K[0] - 34} ${K[1] - 12} 68 ${(68 * 118 / 338).toFixed(2)}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style="background:#cfe9ea">
            ${GEO.villages.map((v) => `<path d="${v.d}" fill="${v.b ? "#f6d9a8" : "#f1e8d4"}" stroke="#e0d0ae" stroke-width="0.25"/>`).join("")}
            <path d="${beachByName("Kuta").d}" fill="none" stroke="#fff" stroke-width="1.2"/>
            <path id="r-snapline" d="M${K[0] + 16} ${K[1] - 2} L${K[0]} ${K[1]}" stroke="#12343b" stroke-width=".5" stroke-dasharray="1.2 1.2" fill="none"/>
            <g id="r-mpin"><circle r="3.5" fill="#ff6b4a" opacity=".25"/><circle r="2" fill="#ff6b4a" stroke="#fff" stroke-width=".8"/></g>
          </svg>
          <span class="chip abs" id="r-where" style="left:50%;top:10px;transform:translateX(-50%);height:30px;font-size:14px">📍 Kuta · Badung</span>
        </div>
        <div class="abs btn" id="r-submit" style="left:18px;right:18px;top:676px">Submit report</div>
      </div>
      ${tapHTML("r-tap1")}${tapHTML("r-tap2")}${tapHTML("r-tap3")}`);
    $("#r-tap1", root).style.cssText += `left:${SW / 2 + 60}px;top:${SHH - 104 - 32}px`;
    $("#r-tap2", root).style.cssText += `left:${SW / 2}px;top:${SHH - 100}px`;
    $("#r-tap3", root).style.cssText += `left:${SW / 2 + 40}px;top:708px`;
    split($(".cap-t", root));
    root.__sum = window.SHORT ? "“A large pile of plastic bottles along the shore.”" : "“A large pile of plastic bottles and a bag at the tide line.”";
  },
  update(t, root) {
    phoneIn($("#r-phone", root), t, 0);
    // captions
    const caps = $("#r-caps", root), capOut = ease(t, 13.7, 14.3, E.inCubic);
    tf($(".eyebrow", caps), { y: (1 - ease(t, 0.3, 0.8)) * 30, o: ease(t, 0.3, 0.8) * (1 - capOut) });
    rise($(".cap-t", caps), t, 0.35, { out: 13.7, dist: 160 });
    bulletsAt(caps, t, [1.0, 3.8, 6.5, 8.8], 13.6);
    // screens
    const map = $("#r-map", root), cam = $("#r-cam", root), sheet = $("#r-sheet", root);
    op(map, t < 2.7 || t > 8.0 ? 1 : 0);
    tapAt($("#r-tap1", root), t, 1.9);
    tf($("#r-btn", root), { s: 1 - 0.06 * Math.sin(Math.PI * prog(t, 1.82, 2.05)) });
    // camera slides up
    const cIn = ease(t, 2.15, 2.6, E.outQuint);
    tf(cam, { y: (1 - cIn) * SHH, o: t > 2.1 && t < 3.6 ? 1 : 0 });
    tapAt($("#r-tap2", root), t, 2.95);
    op($("#r-flash", root), t >= 3.0 ? 1 - ease(t, 3.0, 3.45) : 0);
    // sheet
    const shIn = t >= 3.25;
    const shOut = ease(t, 8.1, 8.55, E.inCubic);
    tf(sheet, { y: shOut * SHH, o: shIn ? (t < 3.45 ? prog(t, 3.25, 3.45) : 1) : 0 });
    const scanK = prog(t, 3.6, 5.0);
    tf($("#r-scan", root), { y: -70 + E.inOutSine((scanK * 2) % 1 || (scanK >= 1 ? 1 : 0)) * 300 * (scanK < 0.5 ? 1 : 1), o: scanK > 0 && scanK < 1 ? 1 : 0 });
    $$(".rbox", root).forEach((b, i) => { const a = 4.2 + i * 0.3, k = spring(t - a, 18, 9); tf(b, { s: t < a ? 0.4 : 1.3 - 0.3 * k, o: t < a ? 0 : Math.min(1, (t - a) * 6) * (1 - ease(t, 6.2, 6.6)) }); });
    txt($("#r-ai-t", root), t < 5.15 ? "Claude is looking…" : "Claude tagged this");
    tf($("#r-ai", root), { s: 1 + 0.08 * Math.sin(Math.PI * prog(t, 5.15, 5.4)), o: ease(t, 3.5, 3.8) });
    $$(".rt", root).forEach((c, i) => tf(c, { s: spring(t - 5.2 - i * 0.07, 16, 9), o: t > 5.2 ? 1 : 0 }));
    tf($("#r-tags", root), { o: t > 5.15 ? 1 : 0.0 });
    op($("#r-skel", root), t > 5.15 ? 0 : 0.55 + 0.45 * Math.sin(t * 7));
    const n = Math.floor(root.__sum.length * prog(t, 5.3, 6.3));
    txt($("#r-sum", root), "✦ " + root.__sum.slice(0, n));
    // pin drop and snap
    const dropK = spring(t - 6.6, 14, 7);
    const snapK = ease(t, 7.0, 7.45, E.inOutCubic);
    const mp = $("#r-mpin", root);
    const px = K[0] + 16 * (1 - snapK), py = K[1] - 2 * (1 - snapK) - (1 - dropK) * 14;
    mp.setAttribute("transform", `translate(${px.toFixed(2)} ${py.toFixed(2)}) scale(${(t < 6.6 ? 0 : 1 + 0.4 * Math.sin(Math.PI * prog(t, 7.4, 7.7))).toFixed(3)})`);
    op($("#r-snapline", root), t > 6.9 && t < 7.6 ? 1 : 0);
    tf($("#r-where", root), { x: -120, y: (1 - spring(t - 7.3, 14, 8)) * -20, o: t > 7.3 ? 1 : 0 });
    tapAt($("#r-tap3", root), t, 7.9);
    tf($("#r-submit", root), { s: 1 - 0.05 * Math.sin(Math.PI * prog(t, 7.82, 8.05)) });
    // back on the map: new pin + toast
    const z = ease(t, 8.3, 9.6, E.inOutCubic);
    const mz = $("#r-msvg .mz", root);
    mz.setAttribute("transform", `translate(${K[0]} ${K[1]}) scale(${(1 + 0.3 * z).toFixed(4)}) translate(${-K[0]} ${-K[1]})`);
    const kp = $("#r-msvg .kpin-in", root);
    const kd = spring(t - 9.0, 14, 7);
    kp.setAttribute("transform", `translate(0 ${((1 - kd) * -40).toFixed(2)}) scale(${(t < 9.0 ? 0 : 1).toFixed(2)})`);
    const pulse = (t * 1.2) % 1;
    $("#r-msvg .kring", root).setAttribute("r", (7 + pulse * 14).toFixed(2)); op($("#r-msvg .kring", root), t > 9.2 ? 1 - pulse : 0);
    const tk = spring(t - 9.35, 12, 8), tOut = ease(t, 12.6, 13.1, E.inBack);
    tf($("#r-toast", root), { y: (1 - tk) * -160 - tOut * 180, o: t > 9.35 ? 1 : 0 });
    tf($("#r-badge", root), { s: spring(t - 10.0, 18, 8), r: (1 - spring(t - 10.0, 18, 8)) * -20 });
    // fade out the whole phone stack only for captions; phone continues into scene 6
  },
});

// ---------- 6. Clean it ----------
scene({
  name: "clean", t0: S.clean, t1: S.compete,
  build(root) {
    root.innerHTML = `
      <div class="abs" style="inset:0;background:var(--sand)"></div>
      <div class="abs" style="left:150px;top:90px;width:760px;height:900px;border-radius:50%;background:radial-gradient(closest-side,#e6f5f4,rgba(230,245,244,0))"></div>
      ${phoneHTML("c-phone")}
      ${captionsHTML("c-caps", "Step 02", "Clean it.", "var(--teal)", [
        "Anyone can clean an open report.",
        "Post an after photo.",
        "Claude compares before and after.<small>A clean score from 0 to 100.</small>",
      ])}
      <div class="abs" id="c-eq" style="left:900px;top:470px;width:960px">
        <div style="display:flex;align-items:flex-start;gap:26px;font-weight:1000;font-size:110px;letter-spacing:-0.04em;line-height:1">
          <div class="eqt"><div>30</div><div class="eql">base</div></div><div class="eqx">×</div>
          <div class="eqt"><div style="color:var(--coral)">4</div><div class="eql">size L</div></div><div class="eqx">×</div>
          <div class="eqt"><div style="color:var(--teal)">92%</div><div class="eql">clean score</div></div>
          <div class="eqx" id="c-eq110" style="color:var(--muted-ink)">= 110</div>
        </div>
        <div id="c-eq2" style="display:flex;align-items:center;gap:26px;margin-top:40px;font-weight:1000;font-size:110px;letter-spacing:-0.04em;line-height:1">
          <div>× 2</div><span class="chip amber" style="height:64px;font-size:34px;padding:0 24px">🔥 hotspot</span>
        </div>
        <div id="c-eq3" style="margin-top:36px;font-weight:1000;font-size:230px;letter-spacing:-0.06em;line-height:.9;color:var(--teal)">+220</div>
      </div>
      <div class="abs card" id="c-note" style="left:900px;top:520px;width:860px;padding:40px 46px;border-radius:36px;background:var(--coral-soft);border-color:#ffc9bb">
        <div style="font-weight:1000;font-size:56px;letter-spacing:-0.02em;color:var(--coral-ink)">Score under 40?</div>
        <div style="font-weight:800;font-size:36px;margin-top:12px;line-height:1.25">Claude still sees trash. The report stays open and earns nothing.</div>
      </div>`;
    const scr = $(".screen", root);
    scr.insertAdjacentHTML("beforeend", `
      <div class="scr" id="c-map">${phoneMapSVG("c-msvg")}${bannerHTML}${tabbar()}
        <div class="toast" id="c-toast"><div style="font-size:40px">✨</div><div style="flex:1"><div class="pts">+220 points</div><div class="tt">Cleanup verified!</div></div></div>
        <div class="abs" style="left:16px;right:16px;top:150px;display:flex;gap:8px;justify-content:center;z-index:71"><span class="chip amber cb" style="height:40px;font-size:16px">🔥 Hotspot hunter</span><span class="chip teal cb" style="height:40px;font-size:16px">💪 Big haul</span></div>
      </div>
      <div class="sheet" id="c-detail" style="height:690px">
        <div class="grab"></div>
        <div class="abs" style="left:18px;right:18px;top:26px;height:200px;border-radius:22px;overflow:hidden">${beachPhoto(true, "cd")}</div>
        <div class="abs" style="left:22px;right:22px;top:240px">
          <div style="display:flex;align-items:baseline;justify-content:space-between"><span style="font-weight:1000;font-size:34px;letter-spacing:-0.02em">Kuta</span><span style="font-weight:800;font-size:14px;color:var(--muted-ink)">Badung</span></div>
          <div style="font-weight:800;font-size:15px;color:var(--muted-ink);margin-top:2px">Reported 2 days ago by 🐢 Wayan</div>
          <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><span class="chip coral">● Open</span><span class="chip amber" id="c-hot">🔥 Hotspot ×2</span><span class="chip teal">🧴 Bottles · L</span></div>
          <div class="card" style="margin-top:16px;padding:14px 16px;border-radius:18px;font-weight:800;font-size:15px;color:var(--muted-ink)">Clean it for up to <b style="color:var(--teal)">240 points</b>. Hotspots are size L or open for 48 h+.</div>
        </div>
        <div class="abs btn" id="c-btn" style="left:18px;right:18px;top:540px">🧹 I cleaned this</div>
      </div>
      <div class="scr" id="c-cam" style="background:#000">
        <div class="abs" style="left:0;right:0;top:84px;height:560px">${beachPhoto(false, "cc")}</div>
        <div class="abs" style="left:0;right:0;top:600px;text-align:center;color:#fff;font-weight:800;font-size:16px;opacity:.8">After photo</div>
        <div class="abs" style="left:50%;bottom:58px;margin-left:-42px;width:84px;height:84px;border-radius:50%;border:5px solid #fff;padding:6px"><div style="width:100%;height:100%;border-radius:50%;background:#fff"></div></div>
        <div class="abs" id="c-flash" style="inset:0;background:#fff"></div>
      </div>
      <div class="scr" id="c-ver" style="background:var(--sand)">
        <div class="abs" style="left:22px;right:22px;top:62px;font-weight:1000;font-size:26px">Claude’s check</div>
        <div class="abs" style="left:18px;right:18px;top:108px;height:250px;border-radius:22px;overflow:hidden">
          ${beachPhoto(true, "cv1")}
          <div class="abs" id="c-after" style="inset:0">${beachPhoto(false, "cv2")}</div>
          <div class="abs" id="c-div" style="top:0;bottom:0;width:4px;margin-left:-2px;background:#fff;box-shadow:0 0 10px rgba(0,0,0,.3)"><div style="position:absolute;top:50%;left:-16px;margin-top:-18px;width:36px;height:36px;border-radius:50%;background:#fff;display:grid;place-items:center;font-weight:1000;font-size:14px;color:var(--ink)">⇆</div></div>
          <span class="chip abs" style="left:10px;top:10px;height:28px;font-size:13px;background:rgba(18,52,59,.8);border:none;color:#fff">Before</span>
          <span class="chip abs" style="right:10px;top:10px;height:28px;font-size:13px;background:rgba(14,159,154,.9);border:none;color:#fff">${window.SHORT ? "After: ✓ clean" : "After"}</span>
        </div>
        <div class="abs" style="left:18px;right:18px;top:380px;display:flex;align-items:center;gap:20px">
          <svg width="150" height="150" viewBox="0 0 150 150"><circle cx="75" cy="75" r="62" stroke="#eadfc8" stroke-width="14" fill="none"/><circle id="c-ring" cx="75" cy="75" r="62" stroke="#22c55e" stroke-width="14" fill="none" stroke-linecap="round" transform="rotate(-90 75 75)"/>
            <text id="c-score" x="75" y="88" text-anchor="middle" font-family="Nunito" font-weight="1000" font-size="44" fill="#12343b">0</text></svg>
          <div><div style="font-weight:900;font-size:14px;letter-spacing:.12em;color:var(--muted-ink)">CLEAN SCORE</div>
            <span class="chip good" id="c-ok" style="margin-top:10px;height:40px;font-size:17px">✓ Verified by Claude</span></div>
        </div>
        <div class="abs" id="c-q" style="left:22px;right:22px;top:560px;font-weight:800;font-size:18px;font-style:italic;line-height:1.35"></div>
        <div class="abs" id="c-pts" style="left:0;right:0;top:650px;text-align:center;font-weight:1000;font-size:64px;letter-spacing:-0.03em;color:var(--teal)">+220</div>
      </div>
      ${tapHTML("c-tap1")}`);
    $("#c-tap1", root).style.cssText += `left:${SW / 2 + 50}px;top:${SHH - 690 + 572}px`;
    split($(".cap-t", root));
    root.__q = "✦ “The bottles and the bag are gone. The sand looks clean.”";
    root.__conf = [...Array(26)].map((_, i) => { const el = h(`<div class="abs" style="width:16px;height:16px;border-radius:${i % 2 ? 4 : 8}px;background:${["#0e9f9a", "#ff6b4a", "#ffd27a", "#22c55e"][i % 4]}"></div>`); $("#c-eq", root).appendChild(el); const a = (i / 26) * Math.PI * 2; return { el, a, d: 180 + (i % 5) * 50 }; });
  },
  update(t, root) {
    tf($("#c-phone", root), { x: PH.x - ease(t, 13.7, 14.4, E.inBack) * 900, y: PH.y, r: -ease(t, 13.7, 14.4) * 8, s: PH.s });
    const caps = $("#c-caps", root);
    tf($(".eyebrow", caps), { y: (1 - ease(t, 0.2, 0.7)) * 30, o: ease(t, 0.2, 0.7) * (1 - ease(t, 13.7, 14.2)) });
    rise($(".cap-t", caps), t, 0.25, { out: 13.7, dist: 160 });
    bulletsAt(caps, t, [0.6, 3.0, 5.0], 7.2);
    // equation
    const eq = $("#c-eq", root), eqOut = ease(t, 10.6, 11.0, E.inCubic);
    $$(".eqt, .eqx", eq).forEach((e, i) => { const a = 7.6 + i * 0.1 + (e.id === "c-eq110" ? 0.3 : 0); const k = spring(t - a, 14, 8); tf(e, { y: (1 - k) * 60, o: (t > a ? 1 : 0) * (1 - eqOut) }); });
    $$(".eql", eq).forEach((l) => { l.style.cssText = "font-size:24px;font-weight:900;letter-spacing:.06em;color:var(--muted-ink);margin-top:10px;text-transform:uppercase"; });
    const e2 = spring(t - 8.6, 14, 8); tf($("#c-eq2", root), { x: (1 - e2) * 120, o: (t > 8.6 ? 1 : 0) * (1 - eqOut) });
    const e3 = spring(t - 9.2, 10, 6); tf($("#c-eq3", root), { s: t < 9.2 ? 0 : 0.6 + 0.4 * e3, o: (t > 9.2 ? 1 : 0) * (1 - eqOut), origin: "10% 60%" });
    root.__conf.forEach((c) => { const k = E.outExpo(prog(t, 9.2, 10.4)); tf(c.el, { x: 180 + Math.cos(c.a) * c.d * k, y: 560 + Math.sin(c.a) * c.d * k + k * k * 80, r: k * 400, o: k > 0 && k < 1 ? 1 - k * k : 0 }); });
    const nk = spring(t - 11.0, 10, 7); tf($("#c-note", root), { y: (1 - nk) * 100, o: (t > 11.0 ? 1 : 0) * (1 - ease(t, 13.6, 14.1)) });
    // phone screens
    const mz = $("#c-msvg .mz", root);
    mz.setAttribute("transform", `translate(${K[0]} ${K[1]}) scale(1.3) translate(${-K[0]} ${-K[1]})`);
    const cleanK = prog(t, 10.9, 11.2);
    $$("#c-msvg .v-kuta", root).forEach((p) => p.setAttribute("fill", healthColor(lerp(55, 95, ease(t, 10.9, 11.8)))));
    $("#c-msvg .kdot", root).setAttribute("fill", cleanK > 0.5 ? "#22c55e" : "#ff6b4a");
    $("#c-msvg .kglow", root).setAttribute("fill", cleanK > 0.5 ? "#22c55e" : "#ff6b4a");
    const pulse = (t * 1.2) % 1;
    const ring = $("#c-msvg .kring", root);
    if (t < 10.9) { ring.setAttribute("r", (7 + pulse * 14).toFixed(2)); ring.setAttribute("stroke", "#ff6b4a"); op(ring, 1 - pulse); }
    else { const b = prog(t, 10.9, 11.8); ring.setAttribute("r", (7 + E.outCubic(b) * 34).toFixed(2)); ring.setAttribute("stroke", "#22c55e"); ring.setAttribute("stroke-width", (4 * (1 - b) + 0.5).toFixed(2)); op(ring, 1 - b); }
    $("#c-msvg .kpin-in", root).setAttribute("transform", `scale(${(1 + 0.6 * Math.sin(Math.PI * cleanK)).toFixed(3)})`);
    const tk = spring(t - 11.1, 12, 8);
    tf($("#c-toast", root), { y: (1 - tk) * -160, o: t > 11.1 ? 1 : 0 });
    $$(".cb", root).forEach((b, i) => { const k = spring(t - 11.4 - i * 0.4, 16, 8); tf(b, { y: 10, s: t < 11.4 + i * 0.4 ? 0 : k, r: (1 - k) * 20 }); });
    // detail sheet
    const dIn = ease(t, 0.1, 0.65, E.outQuint), dOut = t > 2.5;
    tf($("#c-detail", root), { y: (1 - dIn) * 700, o: dOut ? 0 : 1 });
    tf($("#c-hot", root), { s: 1 + 0.06 * Math.sin(t * 6) });
    tapAt($("#c-tap1", root), t, 2.2);
    tf($("#c-btn", root), { s: 1 - 0.05 * Math.sin(Math.PI * prog(t, 2.12, 2.35)) });
    // camera
    tf($("#c-cam", root), { y: (1 - ease(t, 2.45, 2.85, E.outQuint)) * SHH, o: t > 2.4 && t < 3.7 ? 1 : 0 });
    op($("#c-flash", root), t >= 3.2 ? 1 - ease(t, 3.2, 3.6) : 0);
    // verdict
    const vOut = ease(t, 9.8, 10.3, E.inCubic);
    tf($("#c-ver", root), { y: vOut * SHH, o: t > 3.45 ? prog(t, 3.45, 3.6) : 0 });
    const sw = ease(t, 3.6, 4.9, E.inOutCubic);
    const cut = (100 - sw * 100).toFixed(2);
    // The 30s cut has no real after photo, so it shows only the real before photo.
    $("#c-after", root).style.clipPath = window.SHORT ? "inset(0 0 0 100%)" : `inset(0 0 0 ${cut}%)`;
    $("#c-div", root).style.left = cut + "%";
    op($("#c-div", root), !window.SHORT && sw > 0 && sw < 1 ? 1 : 0);
    const sc = Math.round(92 * ease(t, 5.0, 6.4, E.outCubic));
    txt($("#c-score", root), String(sc));
    const R = $("#c-ring", root), L = 2 * Math.PI * 62;
    R.style.strokeDasharray = L; R.style.strokeDashoffset = (L * (1 - sc / 100)).toFixed(1);
    R.setAttribute("stroke", healthColor(sc));
    tf($("#c-ok", root), { s: spring(t - 6.6, 16, 8), o: t > 6.6 ? 1 : 0 });
    txt($("#c-q", root), root.__q.slice(0, Math.floor(root.__q.length * prog(t, 5.8, 6.9))));
    tf($("#c-pts", root), { s: spring(t - 9.2, 14, 7), o: t > 9.2 ? 1 : 0 });
  },
});

// ---------- 7. Beaches compete ----------
const LEAGUE = [["Sanur", 90, 3], ["Canggu", 80, 4], ["Seminyak", 75, 5], ["Jimbaran", 70, 6], ["Legian", 60, 8]];
const KSTEPS = [[1.2, -20, "L"], [1.8, -10, "M"], [2.4, -5, "S"], [3.0, -10, "M"], [3.6, -20, "L"], [4.8, 20, "L"], [5.4, 20, "L"], [6.0, 10, "M"], [6.6, 10, "M"]];
function kutaHealth(t) {
  let hv = 100;
  for (const [a, d] of KSTEPS) hv += d * E.outCubic(prog(t, a, a + 0.3));
  return hv;
}
const sig = (x) => 1 / (1 + Math.exp(-x));
scene({
  name: "compete", t0: S.compete, t1: S.game,
  build(root) {
    const chips = [["L", -20], ["M", -10], ["S", -5], ["M", -10], ["L", -20]];
    root.innerHTML = `
      <div class="abs" style="inset:0;background:var(--sand)"></div>
      <div class="abs" id="k-all" style="inset:0">
      <div class="abs" style="left:110px;top:80px">
        <div class="eyebrow" id="k-eb" style="color:var(--amber-ink)">Step 03</div>
        <div class="h1" id="k-h" style="font-size:120px;margin-top:14px">Beaches compete.</div>
      </div>
      <div class="abs card" id="k-left" style="left:110px;top:330px;width:760px;height:640px;border-radius:44px;padding:44px">
        <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-weight:1000;font-size:64px;letter-spacing:-0.03em">Kuta</span><span style="font-weight:900;font-size:24px;color:var(--muted-ink)">Beach health</span></div>
        <div style="display:flex;gap:40px;margin-top:20px;align-items:center">
          <svg width="330" height="330" viewBox="0 0 330 330"><circle cx="165" cy="165" r="140" stroke="#f3ecdd" stroke-width="30" fill="none"/>
            <circle id="k-ring" cx="165" cy="165" r="140" stroke="#22c55e" stroke-width="30" fill="none" stroke-linecap="round" transform="rotate(-90 165 165)"/>
            <text id="k-num" x="165" y="196" text-anchor="middle" font-family="Nunito" font-weight="1000" font-size="104" fill="#12343b" letter-spacing="-4">100</text></svg>
          <div id="k-stack" style="position:relative;width:300px;height:330px">
            ${chips.map(([s, w], i) => `<div class="abs kc" style="left:0;top:${i * 64}px;width:300px;height:54px;border-radius:18px;background:var(--coral-soft);display:flex;align-items:center;justify-content:space-between;padding:0 18px;font-weight:1000;font-size:24px;color:var(--coral-ink)"><span>🗑️ Open · ${s}</span><span>${w}</span></div>`).join("")}
          </div>
        </div>
        <div style="margin-top:26px;font-weight:1000;font-size:34px;letter-spacing:-0.01em">health = 100 − open trash
          <div style="display:flex;gap:12px;margin-top:12px"><span class="chip coral" style="height:44px;font-size:20px">S −5</span><span class="chip coral" style="height:44px;font-size:20px">M −10</span><span class="chip coral" style="height:44px;font-size:20px">L −20</span></div></div>
      </div>
      <div class="abs card" id="k-right" style="left:930px;top:330px;width:880px;height:640px;border-radius:44px;padding:40px 44px">
        <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-weight:1000;font-size:40px;letter-spacing:-0.02em">This week’s league</span><span style="font-weight:900;font-size:22px;color:var(--muted-ink)">week of 9 Nov</span></div>
        <div id="k-rows" style="position:relative;margin-top:24px;height:520px"></div>
      </div>
      <div class="abs" id="k-cap" style="left:0;right:0;top:996px;text-align:center;font-weight:900;font-size:40px"></div>
      </div>`;
    const rows = $("#k-rows", root);
    const all = [["Kuta", 100, 5], ...LEAGUE];
    root.__rows = all.map(([n, hv, cl]) => {
      const el = h(`<div class="abs" style="left:0;right:0;height:72px;border-radius:20px;display:flex;align-items:center;gap:18px;padding:0 18px;font-weight:900;font-size:28px">
        <div class="rk" style="width:46px;height:46px;border-radius:14px;background:var(--muted);display:grid;place-items:center;font-size:22px;font-weight:1000"></div>
        <div style="width:200px;font-weight:1000">${n}</div>
        <div style="flex:1;height:18px;border-radius:9px;background:var(--muted);overflow:hidden"><div class="bar" style="height:100%;border-radius:9px"></div></div>
        <div class="hv" style="width:60px;text-align:right;font-weight:1000"></div>
        <div class="crown abs" style="left:-4px;top:-30px;font-size:44px">👑</div></div>`);
      rows.appendChild(el); return { el, n, hv };
    });
    const nd = h(`<div class="abs" id="k-nd" style="left:0;right:0;top:${6 * 76 + 8}px;height:60px;border-radius:20px;display:flex;align-items:center;gap:18px;padding:0 18px;font-weight:900;font-size:24px;color:var(--muted-ink);border:3px dashed var(--border)">
      <div style="width:46px;text-align:center">–</div><div style="width:200px">Amed</div><div style="flex:1">No data yet · not ranked</div></div>`);
    rows.appendChild(nd);
    split($("#k-eb", root)); split($("#k-h", root));
  },
  update(t, root) {
    rise($("#k-eb", root), t, 0.1); rise($("#k-h", root), t, 0.15, { stagger: 0.07 });
    const lk = spring(t - 0.5, 10, 7), rk = spring(t - 0.7, 10, 7);
    tf($("#k-left", root), { y: (1 - lk) * 200, o: t > 0.5 ? 1 : 0 });
    tf($("#k-right", root), { y: (1 - rk) * 200, o: t > 0.7 ? 1 : 0 });
    const hv = kutaHealth(t);
    txt($("#k-num", root), String(Math.round(hv)));
    const R = $("#k-ring", root), L = 2 * Math.PI * 140;
    R.style.strokeDasharray = L; R.style.strokeDashoffset = (L * (1 - hv / 100)).toFixed(1); R.setAttribute("stroke", healthColor(hv));
    // open report chips stack in, then get cleaned (largest first)
    const cleanOrder = [0, 4, 1, 3];
    $$(".kc", root).forEach((c, i) => {
      const a = 1.2 + i * 0.6, k = spring(t - a, 16, 8);
      const ci = cleanOrder.indexOf(i), ca = ci >= 0 ? 4.8 + ci * 0.6 : Infinity;
      const gone = E.inBack(prog(t, ca, ca + 0.35));
      tf(c, { x: (1 - k) * 200 + gone * 340, s: t < a ? 0.6 : 1, o: (t > a ? 1 : 0) * (1 - gone) });
      css(c, "background", t > ca ? "var(--good-soft)" : "var(--coral-soft)");
    });
    // league rows: smooth ranking
    const rows = root.__rows;
    const vals = rows.map((r, i) => (i === 0 ? hv : r.hv));
    rows.forEach((r, i) => {
      let pos = 0;
      vals.forEach((v, j) => { if (j !== i) pos += sig((v - vals[i]) / 1.6 + (j < i ? 0.001 : -0.001)); });
      const a = 0.9 + i * 0.08, k = spring(t - a, 12, 8);
      tf(r.el, { y: pos * 76, x: (1 - k) * 60, o: t > a ? 1 : 0 });
      const v = vals[i];
      $(".bar", r.el).style.width = v + "%"; $(".bar", r.el).style.background = healthColor(v);
      txt($(".hv", r.el), String(Math.round(v)));
      txt($(".rk", r.el), String(Math.round(pos) + 1));
      css(r.el, "background", i === 0 ? "var(--teal-soft)" : "transparent");
      const crown = $(".crown", r.el);
      if (i === 0) { const ck = spring(t - 7.6, 12, 6); tf(crown, { y: (1 - ck) * -120, r: -18 + (1 - ck) * -30, o: t > 7.6 ? 1 : 0 }); }
      else op(crown, 0);
    });
    const nd = spring(t - 9.8, 12, 8); tf($("#k-nd", root), { y: (1 - nd) * 40, o: t > 9.8 ? 1 : 0 });
    const cap = $("#k-cap", root);
    if (t < 10.3) { cap.innerHTML !== root.__c1 && (cap.innerHTML = root.__c1 = "The beach with the <span style='color:var(--teal)'>fewest open reports</span> wins the week."); }
    else if (cap.innerHTML !== root.__c2) cap.innerHTML = root.__c2 = "No reports this week? <span style='color:var(--coral)'>No rank.</span> Hiding trash never wins.";
    const ca = t < 10.3 ? 8.2 : 10.3;
    tf(cap, { y: (1 - ease(t, ca, ca + 0.5, E.outQuint)) * 40 - 0, o: ease(t, ca, ca + 0.4) * (t < 10.3 ? 1 - ease(t, 10.0, 10.3) : 1) });
    const out = ease(t, 13.7, 14.4, E.inCubic);
    tf($("#k-all", root), { s: 1 - out * 0.08, o: 1 - out });
  },
});

// ---------- 8. Reuse it: the Workshop ----------
const WS = {
  en: { tab: "Workshop", sub: "Turn beach trash into something useful.", title: "Self-watering bottle planter", easy: "Easy", min: "30 min", type: "Bottles", need: "You'll need", steps: "Steps", safety: "Safety first",
    mats: ["1 plastic bottle (1.5 liter is good)", "Scissors or a small knife", "A piece of old cloth or a thick string"],
    st: ["Wash the bottle inside and out. Take off the label.", "Ask an adult to cut the bottle in half. Keep the bottom part and the top part with the neck.", "Ask an adult to make a small hole in the cap. Push the cloth or string through it."],
    safe: "Ask an adult to cut the bottle." },
};
const WCARDS = [["🪴", "Self-watering bottle planter", "Turn a plastic bottle into a small pot that waters the plant by itself.", "Easy", "good", "30 min"],
  ["🧹", "Bottle broom", "Cut plastic bottles into strips to make a strong, free broom.", "Medium", "amber", "40 min"],
  ["🎨", "Bottle cap mosaic", "Use colorful bottle caps to make a picture for a wall or a table.", "Medium", "amber", "90 min"]];
const WPH = { x: 1190, y: 125 };
scene({
  name: "workshop", t0: S.workshop, t1: S.game,
  build(root) {
    const r = rng(11);
    const float = ["🧱", "🪴", "🧹", "🛍️", "🌿", "🪵", "🎨", "🩴", "👜", "♻️", "🍂"].map((e, i) => ({ e, x: 80 + r() * 1000, y: 120 + r() * 860, s: 0.6 + r() * 0.8, ph: r() * 6 }));
    root.innerHTML = `
      <div class="abs" style="inset:0;background:var(--sand)"></div>
      <div class="abs" style="left:1010px;top:90px;width:760px;height:900px;border-radius:50%;background:radial-gradient(closest-side,#ede9fe,rgba(237,233,254,0))"></div>
      <div id="w-float">${float.map((f) => `<div class="abs wf" style="font-size:${(56 * f.s).toFixed(0)}px;opacity:.13">${f.e}</div>`).join("")}</div>
      ${phoneHTML("w-phone")}
      <div class="caps" id="w-caps" style="left:110px;width:960px">
        <div class="eyebrow" style="color:#7c3aed">Step 04 · New</div>
        <div class="h1 cap-t" style="font-size:136px;margin-top:18px">Reuse it.</div>
        <div class="bullets">
          <div class="bl"><div class="n">1</div><div>Tap <span style="color:var(--teal)">“I want to reuse”</span> while you report.</div></div>
          <div class="bl"><div class="n">2</div><div>The Workshop opens on that trash type.<small>11 step-by-step guides: eco-bricks, planters, net bags, mosaics…</small></div></div>
          <div class="bl"><div class="n">3</div><div>What you need, the steps, and a safety tip.<small>Like: “Ask an adult to cut the bottle.”</small></div></div>
        </div>
      </div>`;
    root.__f = float.map((f, i) => ({ ...f, el: $$(".wf", root)[i] }));
    const scr = $(".screen", root);
    const L = WS.en;
    scr.insertAdjacentHTML("beforeend", `
      <div class="scr" id="w-rep" style="background:var(--sand)">
        <div class="abs" style="left:22px;right:22px;top:62px;display:flex;justify-content:space-between;align-items:center"><span style="font-weight:1000;font-size:26px">New report</span><span style="font-weight:900;font-size:22px;color:var(--muted-ink)">✕</span></div>
        <div class="abs" style="left:18px;right:18px;top:108px;height:230px;border-radius:22px;overflow:hidden">${beachPhoto(true, "wr")}</div>
        <div class="abs" style="left:18px;right:18px;top:356px;display:flex;gap:8px;flex-wrap:wrap"><span class="chip on">🧴 Bottles</span><span class="chip">🛍️ Plastic</span><span class="chip">🕸️ Nets</span></div>
        <div class="abs" style="left:18px;right:18px;top:420px;display:flex;gap:10px;align-items:center">
          <span class="chip coral" style="height:44px;font-size:16px">+40 pts</span>
          <div id="w-reuse" style="flex:1;height:50px;border-radius:18px;background:var(--teal-soft);border:2px solid #b6e3e1;color:var(--teal-ink);display:flex;align-items:center;justify-content:center;gap:8px;font-weight:1000;font-size:17px">♻️ I want to reuse</div>
        </div>
        <div class="abs btn" style="left:18px;right:18px;top:676px">Submit report</div>
      </div>
      <div class="scr" id="w-list" style="background:var(--sand)">
        <div class="abs" style="left:20px;right:20px;top:64px">
          <div style="font-weight:1000;font-size:34px;letter-spacing:-0.02em">${L.tab}</div>
          <div style="font-weight:800;font-size:15px;color:var(--muted-ink)">${L.sub}</div>
          <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:14px"><span class="chip">All</span><span class="chip">Plastic</span><span class="chip on" id="w-chip">Bottles</span><span class="chip">Nets</span><span class="chip">Organic</span></div>
          <div style="margin-top:16px;display:flex;flex-direction:column;gap:12px">
            ${WCARDS.map(([e, ti, b, d, dc, m]) => `<div class="card wc" style="display:flex;gap:12px;padding:13px;border-radius:20px;align-items:center">
              <div style="flex:none;width:58px;height:58px;border-radius:18px;background:var(--teal-soft);display:grid;place-items:center;font-size:32px">${e}</div>
              <div style="flex:1;min-width:0"><div style="font-weight:1000;font-size:16px;line-height:1.15">${ti}</div><div style="font-weight:700;font-size:12.5px;color:var(--muted-ink);margin-top:3px;line-height:1.3">${b}</div>
                <div style="display:flex;gap:6px;margin-top:7px;align-items:center"><span class="chip ${dc}" style="height:22px;font-size:11px;padding:0 8px">${d}</span><span style="font-weight:800;font-size:12px;color:var(--muted-ink)">⏱ ${m}</span><span class="chip" style="height:22px;font-size:11px;padding:0 8px;background:var(--muted);border:none">Bottles</span></div></div>
              <div style="color:#b8ab8e;font-weight:900">›</div></div>`).join("")}
          </div>
        </div>
        ${tabbar().replace('class="tab on"', 'class="tab"').replace('<div class="tab"><span>🔨</span>', '<div class="tab on"><span>🔨</span>')}
      </div>
      <div class="scr" id="w-det" style="background:var(--sand)">
        <div class="abs" style="left:18px;right:18px;top:60px;display:flex;justify-content:space-between;align-items:center">
          <span style="display:flex;align-items:center;gap:8px;font-weight:900;font-size:15px;color:var(--teal-ink)"><span style="width:36px;height:36px;border-radius:50%;background:var(--muted);display:grid;place-items:center;color:var(--ink)">←</span>Back</span>
</div>
        <div class="abs" style="left:18px;right:18px;top:110px;display:flex;gap:14px;align-items:center">
          <div id="w-emo" style="flex:none;width:72px;height:72px;border-radius:24px;background:var(--teal-soft);display:grid;place-items:center;font-size:42px">🪴</div>
          <div style="min-width:0"><div class="wl" data-k="title" style="font-weight:1000;font-size:21px;line-height:1.15"></div>
            <div style="display:flex;gap:6px;margin-top:7px;align-items:center"><span class="chip good wl" data-k="easy" style="height:22px;font-size:11px;padding:0 8px"></span><span class="wl" data-k="min" style="font-weight:800;font-size:12px;color:var(--muted-ink)"></span><span class="chip wl" data-k="type" style="height:22px;font-size:11px;padding:0 8px;background:var(--muted);border:none"></span></div></div></div>
        <div class="abs card" style="left:18px;right:18px;top:204px;padding:12px 14px;border-radius:18px">
          <div class="wl" data-k="need" style="font-weight:1000;font-size:14px"></div>
          ${[0, 1, 2].map((i) => `<div style="display:flex;gap:8px;font-weight:700;font-size:13px;margin-top:6px"><span style="color:var(--teal)">•</span><span class="wl" data-k="mats" data-i="${i}"></span></div>`).join("")}
        </div>
        <div class="abs" style="left:18px;right:18px;top:350px">
          <div class="wl" data-k="steps" style="font-weight:1000;font-size:14px"></div>
          ${[0, 1, 2].map((i) => `<div class="wst" style="display:flex;gap:10px;margin-top:10px;align-items:flex-start"><span style="flex:none;width:28px;height:28px;border-radius:10px;background:var(--teal);color:#fff;display:grid;place-items:center;font-weight:1000;font-size:14px">${i + 1}</span><span class="wl" data-k="st" data-i="${i}" style="font-weight:700;font-size:13.5px;line-height:1.35"></span></div>`).join("")}
        </div>
        <div class="abs" id="w-safe" style="left:18px;right:18px;top:530px;padding:12px 14px;border-radius:18px;background:var(--amber-soft);border:2px solid #fcd98a">
          <div class="wl" data-k="safety" style="font-weight:1000;font-size:14px;color:var(--amber-ink)"></div>
          <div class="wl" data-k="safe" style="font-weight:700;font-size:13px;margin-top:4px"></div></div>
      </div>
      ${tapHTML("w-tap1")}${tapHTML("w-tap2")}`);
    $("#w-tap1", root).style.cssText += `left:${SW / 2 + 70}px;top:445px`;
    $("#w-tap2", root).style.cssText += `left:${SW / 2 + 30}px;top:225px`;
    split($(".cap-t", root));
  },
  update(t, root) {
    const ph = $("#w-phone", root), k = spring(t - 0.1, 7, 6), out = ease(t, 9.0, 9.6, E.inBack);
    tf(ph, { x: WPH.x + out * 900, y: WPH.y + (1 - k) * 900, r: (1 - k) * 10 + out * 8 });
    root.__f.forEach((f) => tf(f.el, { x: f.x + Math.sin(t * 0.5 + f.ph) * 30, y: f.y + Math.cos(t * 0.4 + f.ph) * 24 - t * 8, r: Math.sin(t + f.ph) * 15, o: 0.1 * ease(t, 0.2, 1.2) * (1 - ease(t, 9.0, 9.5)) }));
    const caps = $("#w-caps", root);
    tf($(".eyebrow", caps), { y: (1 - ease(t, 0.3, 0.8)) * 30, o: ease(t, 0.3, 0.8) * (1 - ease(t, 9.0, 9.4)) });
    rise($(".cap-t", caps), t, 0.35, { out: 9.0, dist: 160 });
    bulletsAt(caps, t, [0.9, 2.4, 5.6], 9.0);
    // screens
    tapAt($("#w-tap1", root), t, 1.4);
    tf($("#w-reuse", root), { s: 1 - 0.06 * Math.sin(Math.PI * prog(t, 1.32, 1.55)) });
    const li = ease(t, 1.6, 2.05, E.outQuint), de = ease(t, 5.0, 5.45, E.outQuint);
    tf($("#w-rep", root), { x: -li * 120, o: 1 - li });
    tf($("#w-list", root), { x: (1 - li) * SW - de * 120, o: t > 1.6 ? 1 - de : 0 });
    tf($("#w-det", root), { x: (1 - de) * SW, o: t > 5.0 ? 1 : 0 });
    $$(".wc", root).forEach((c, i) => { const a = 2.4 + i * 0.2, kk = spring(t - a, 12, 8); tf(c, { y: (1 - kk) * 50, o: t > a ? 1 : 0, s: i === 0 ? 1 - 0.04 * Math.sin(Math.PI * prog(t, 4.72, 4.95)) : 1 }); });
    tf($("#w-chip", root), { s: 1 + 0.12 * Math.sin(Math.PI * prog(t, 3.4, 3.7)) });
    tapAt($("#w-tap2", root), t, 4.8);
    $$(".wst", root).forEach((s, i) => { const a = 5.8 + i * 0.3, kk = spring(t - a, 12, 8); tf(s, { x: (1 - kk) * 40, o: t > a ? 1 : 0 }); });
    tf($("#w-safe", root), { y: (1 - spring(t - 6.8, 12, 8)) * 30, o: t > 6.8 ? 1 : 0 });
    tf($("#w-emo", root), { s: 1 + 0.08 * Math.sin(t * 3), r: Math.sin(t * 2) * 4 });
    if (!root.__filled) {
      root.__filled = true;
      $$(".wl", root).forEach((el) => { const v = WS.en[el.dataset.k]; el.textContent = el.dataset.i !== undefined ? v[+el.dataset.i] : v; });
    }
  },
});
