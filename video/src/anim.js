/* Hai Pantai explainer. Every frame is a pure function of time: window.renderFrame(t). */
(() => {
  const W = 1920, H = 1080, DUR = 76;
  const G = window.GEO;
  const stage = document.getElementById("stage");

  // ---------- math & easing ----------
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const L = (a, b, k) => a + (b - a) * k;
  const E = {
    lin: (k) => k,
    out: (k) => 1 - Math.pow(1 - k, 3),
    out5: (k) => 1 - Math.pow(1 - k, 5),
    in: (k) => k * k * k,
    io: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    sine: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
    back: (k) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
    back2: (k) => { const c1 = 3, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
    elastic: (k) => (k <= 0 ? 0 : k >= 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  };
  /** eased progress of an animation starting at a and lasting d */
  const A = (t, a, d, e = E.out) => e(P(t, a, a + d));
  /** 0→1 in, hold, 1→0 out */
  const invIo = (v) => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (E.io(m) < v) lo = m; else hi = m; } return lo; };
  const inOut = (t, a, d, b, d2 = d) => A(t, a, d) * (1 - A(t, b, d2, E.in));
  const rnd = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; };

  // ---------- DOM helpers ----------
  const cache = new Map();
  const $ = (id) => { let e = cache.get(id); if (!e) { e = document.getElementById(id); cache.set(id, e); } return e; };
  function tf(el, o) {
    if (typeof el === "string") el = $(el);
    const { x = 0, y = 0, s = 1, sx, sy, r = 0, ry = 0, op } = o;
    el.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${r.toFixed(2)}deg)${ry ? ` perspective(900px) rotateY(${ry.toFixed(2)}deg)` : ""} scale(${(sx ?? s).toFixed(4)},${(sy ?? s).toFixed(4)})`;
    if (op !== undefined) { el.style.opacity = clamp(op).toFixed(3); el.style.visibility = op <= 0.001 ? "hidden" : "visible"; }
  }
  const op = (id, v) => { const el = typeof id === "string" ? $(id) : id; el.style.opacity = clamp(v).toFixed(3); el.style.visibility = v <= 0.001 ? "hidden" : "visible"; };
  const txt = (id, s) => { const el = $(id); if (el.textContent !== s) el.textContent = s; };
  const add = (parent, html) => { parent.insertAdjacentHTML("beforeend", html); return parent.lastElementChild; };

  /** wrap words so they can be animated one by one */
  function words(id, html, cls = "") {
    return html.split(/\s+(?![^<]*>)/).map((w, i) => `<span class="word ${cls}" id="${id}-${i}">${w}</span>`).join(" ");
  }
  function animWords(id, n, t, start, stagger = 0.06, exitAt = 1e9, dist = 50) {
    for (let i = 0; i < n; i++) {
      const el = $(`${id}-${i}`);
      if (!el) break;
      const k = A(t, start + i * stagger, 0.55, E.out5);
      const x = A(t, exitAt + i * 0.025, 0.35, E.in);
      tf(el, { y: (1 - k) * dist - x * 40, op: k * (1 - x) });
    }
  }
  const nWords = (html) => html.split(/\s+(?![^<]*>)/).length;
  function textBlock(parent, id, html, style, cls = "") {
    add(parent, `<div class="abs ${cls}" id="${id}" style="${style}">${words(id, html)}</div>`);
    return nWords(html);
  }
  function markIn(id, t, a, d = 0.6) { $(id).style.setProperty("--w", (A(t, a, d, E.io) * 100).toFixed(1) + "%"); }

  // waves
  function wavePath(base, amp, wl, ph, w = W, h = H, step = 24) {
    let d = `M0 ${h}L0 ${(base + amp * Math.sin(ph)).toFixed(1)}`;
    for (let x = 0; x <= w + step; x += step) {
      const y = base + amp * Math.sin((x / wl) * 2 * Math.PI + ph) + amp * 0.35 * Math.sin((x / (wl * 0.53)) * 2 * Math.PI + ph * 1.7);
      d += `L${x} ${y.toFixed(1)}`;
    }
    return d + `L${w + step} ${h}Z`;
  }
  /** a band between two wavy edges (for transitions). horizontal: edges are vertical lines at x=a and x=b */
  function bandPath(a, b, amp, ph, vertical) {
    const pts1 = [], pts2 = [];
    const len = vertical ? W : H, step = 30;
    for (let u = -step; u <= len + step; u += step) {
      const w1 = amp * Math.sin(u / 140 + ph) + amp * 0.4 * Math.sin(u / 61 + ph * 1.6);
      const w2 = amp * Math.sin(u / 150 + ph + 2) + amp * 0.4 * Math.sin(u / 57 + ph * 1.3);
      pts1.push(vertical ? [u, a + w1] : [a + w1, u]);
      pts2.push(vertical ? [u, b + w2] : [b + w2, u]);
    }
    const all = pts1.concat(pts2.reverse());
    return "M" + all.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + "Z";
  }

  // ---------- reusable art ----------
  function trashArt(clean, id) {
    const r = rnd(7);
    let foot = "";
    for (let i = 0; i < 7; i++) foot += `<ellipse cx="${60 + i * 52}" cy="${210 + (i % 2) * 22 - i * 3}" rx="9" ry="14" fill="#e3cc9c" transform="rotate(${-62} ${60 + i * 52} ${210 + (i % 2) * 22 - i * 3})"/>`;
    let grain = "";
    for (let i = 0; i < 60; i++) grain += `<circle cx="${(r() * 400).toFixed(0)}" cy="${(105 + r() * 200).toFixed(0)}" r="${(1 + r() * 1.6).toFixed(1)}" fill="#d8bf8c" opacity=".6"/>`;
    const trash = clean ? "" : `
      <g transform="translate(95 150) rotate(-18)"><rect x="0" y="0" width="34" height="86" rx="12" fill="#8ecae6" opacity=".9"/><rect x="9" y="-14" width="16" height="16" rx="3" fill="#1d6fa3"/><rect x="4" y="30" width="26" height="22" fill="#ff8a65" opacity=".85"/></g>
      <g transform="translate(250 175) rotate(62)"><rect x="0" y="0" width="30" height="78" rx="11" fill="#a8dadc" opacity=".9"/><rect x="8" y="-12" width="14" height="14" rx="3" fill="#2a9d8f"/></g>
      <path d="M170 150c-14 6-24 30-14 52 12 26 54 30 76 14 18-14 18-44 2-58-8-6-14-2-16 4-10-12-36-18-48-12z" fill="#f4f4f2" stroke="#d8d8d2" stroke-width="3"/>
      <path d="M186 148c-4-12 2-22 8-22M214 146c4-12 0-22-6-24" stroke="#d8d8d2" stroke-width="4" fill="none" stroke-linecap="round"/>
      <g transform="translate(300 128) rotate(14)"><rect width="30" height="44" rx="6" fill="#b0bec5"/><rect y="12" width="30" height="16" fill="#e53935"/></g>
      <path d="M40 230l26-8 6 14-24 10z" fill="#ffd166"/><path d="M330 225l22 4-4 16-20-6z" fill="#06d6a0" opacity=".8"/>
      <path d="M120 255c30-8 60 6 90-2" stroke="#6b705c" stroke-width="3" fill="none" opacity=".6"/>`;
    return `<svg id="${id}" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style="display:block">
      <defs><linearGradient id="${id}-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e4bc"/><stop offset="1" stop-color="#ecd29f"/></linearGradient></defs>
      <rect width="400" height="300" fill="url(#${id}-s)"/>
      <path d="M0 0H400V92C340 108 300 84 240 98S120 112 60 96 0 100 0 100Z" fill="#7fd0cb"/>
      <path d="M0 100C60 96 120 112 180 100S300 86 400 96" stroke="#fff" stroke-width="7" fill="none" opacity=".85"/>
      ${grain}${clean ? foot : ""}${trash}</svg>`;
  }

  function markSVG(id) {
    return `<svg id="${id}" viewBox="0 0 64 64" width="100%" height="100%"><defs><clipPath id="${id}-c"><rect width="64" height="64" rx="16"/></clipPath></defs>
      <rect width="64" height="64" rx="16" fill="#0e9f9a"/><g clip-path="url(#${id}-c)"><circle id="${id}-sun" cx="44" cy="20" r="7" fill="#ffd27a"/>
      <path id="${id}-w1" fill="#fbf6ec"/><path id="${id}-w2" fill="none" stroke="#0e9f9a" stroke-width="3" stroke-linecap="round"/></g></svg>`;
  }
  function markRender(id, t) {
    let d1 = "M-4 64", d2 = "";
    for (let x = -4; x <= 68; x += 2) { const y = 40 + 3 * Math.sin(x / 6 + t * 3); d1 += `L${x} ${y.toFixed(2)}`; d2 += (d2 ? "L" : "M") + `${x} ${(y + 8).toFixed(2)}`; }
    $(id + "-w1").setAttribute("d", d1 + "L68 64Z");
    $(id + "-w2").setAttribute("d", d2);
  }

  /** ocean + sky backdrop (intro and outro) */
  function seaScene(root, p) {
    add(root, `<div class="abs" style="inset:0;background:linear-gradient(180deg,#fff8e8 0%,#ffeccb 52%,#ffd9a6 72%)"></div>`);
    add(root, `<div class="abs" id="${p}sun" style="left:1500px;top:0;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,#fff1c4 0,#ffd27a 62%,#ffc25e 100%);box-shadow:0 0 140px 60px rgba(255,200,110,.55)"></div>`);
    let birds = "";
    for (let i = 0; i < 3; i++) birds += `<path id="${p}bird${i}" d="M0 0Q12 -10 24 0Q36 -10 48 0" stroke="#12343b" stroke-width="4" fill="none" stroke-linecap="round" opacity=".55"/>`;
    let spark = "";
    for (let i = 0; i < 18; i++) spark += `<rect id="${p}sp${i}" width="${16 + (i % 4) * 8}" height="4" rx="2" fill="#fff"/>`;
    add(root, `<svg class="abs" style="left:0;top:0" width="${W}" height="${H}"><g>${birds}</g>
      <path id="${p}w0" fill="#a6e0dc"/><path id="${p}w1" fill="#6ccbc4"/><path id="${p}w2" fill="#2fb3ac"/><path id="${p}w3" fill="#0e9f9a"/><g>${spark}</g>
      <path id="${p}sand" fill="#f6e7c6"/><path id="${p}foam" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".9"/></svg>`);
    return (t, sunK = 1) => {
      tf(`${p}sun`, { y: L(820, 620, sunK) - 150 });
      const bases = [760, 805, 860, 930], amps = [7, 10, 14, 18], wls = [520, 430, 360, 300], sp = [0.5, -0.7, 0.9, -1.1];
      for (let i = 0; i < 4; i++) $(`${p}w${i}`).setAttribute("d", wavePath(bases[i], amps[i], wls[i], t * sp[i] + i));
      const sb = 1010 + 8 * Math.sin(t * 1.3);
      $(`${p}sand`).setAttribute("d", wavePath(sb, 10, 900, t * 0.4 + 1.2, W, H, 40));
      $(`${p}foam`).setAttribute("d", wavePath(sb - 6, 10, 900, t * 0.4 + 1.2, W, H, 40).replace(/^M0 \d+L/, "M").replace(/L\d+ \d+Z$/, ""));
      for (let i = 0; i < 3; i++) {
        const x = ((180 + i * 260 + t * (30 + i * 9)) % 2200) - 140, y = 170 + i * 70 + 10 * Math.sin(t + i);
        const f = 0.55 + 0.45 * Math.sin(t * 7 + i * 2);
        $(`${p}bird${i}`).setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${0.8 - i * 0.12} ${(0.8 - i * 0.12) * f})`);
      }
      const r = rnd(3);
      for (let i = 0; i < 18; i++) {
        const x = r() * W, y = 790 + r() * 180, ph = r() * 6;
        const el = $(`${p}sp${i}`);
        el.setAttribute("x", ((x + t * 14) % W).toFixed(0)); el.setAttribute("y", y.toFixed(0));
        el.setAttribute("opacity", clamp(Math.sin(t * 2.2 + ph) * 1.4 - 0.3).toFixed(2));
      }
    };
  }

  /** confetti burst, deterministic */
  function confetti(parent, id, n, seed, colors = ["#0e9f9a", "#ff6b4a", "#ffd27a", "#22c55e", "#5cc6bf", "#f59e0b"]) {
    const r = rnd(seed), parts = [];
    let html = "";
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (r() - 0.5) * 2.4, v = 500 + r() * 900;
      parts.push({ vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: (r() - 0.5) * 1400, w: 8 + r() * 10, h: 12 + r() * 14, round: r() < 0.3 });
      html += `<div class="abs" id="${id}${i}" style="left:0;top:0;width:${parts[i].w.toFixed(0)}px;height:${(parts[i].round ? parts[i].w : parts[i].h).toFixed(0)}px;border-radius:${parts[i].round ? "50%" : "3px"};background:${colors[i % colors.length]};visibility:hidden"></div>`;
    }
    add(parent, `<div class="abs" style="left:0;top:0;width:0;height:0" id="${id}">${html}</div>`);
    return (t, t0, x0, y0, scale = 1) => {
      const k = t - t0;
      for (let i = 0; i < n; i++) {
        const el = $(`${id}${i}`), p = parts[i];
        if (k < 0 || k > 2.2) { el.style.visibility = "hidden"; continue; }
        const drag = (1 - Math.exp(-k * 3)) / 3;
        const x = x0 + p.vx * drag * scale, y = y0 + (p.vy * drag + 700 * k * k * 0.5) * scale;
        tf(el, { x, y, r: p.rot * k, sx: Math.cos(k * 9 + i), op: 1 - P(k, 1.4, 2.2) });
      }
    };
  }

  function tapUI(parent, id) {
    add(parent, `<div class="tap" id="${id}"><div class="ring" id="${id}r"></div><div class="dot" id="${id}d"></div></div>`);
    return (t, tt, x, y) => {
      const el = $(id);
      if (t < tt - 0.5 || t > tt + 0.55) { el.style.visibility = "hidden"; return; }
      el.style.left = x + "px"; el.style.top = y + "px";
      const inK = A(t, tt - 0.5, 0.35), press = A(t, tt - 0.08, 0.08) * (1 - A(t, tt + 0.05, 0.15));
      tf(el, { s: L(1.4, 1, inK) * (1 - 0.15 * press), op: inK * (1 - A(t, tt + 0.25, 0.3)) });
      const rk = A(t, tt, 0.5);
      tf(`${id}r`, { s: 0.6 + rk * 1.2, op: t >= tt ? 1 - rk : 0 });
      tf(`${id}d`, { s: 1 });
    };
  }

  // Phone map (Kuta) ---------------------------------------------------------
  const kuta = G.beaches["kuta-badung"].c;
  const kutaPts = G.localPts.filter((p) => p[2] === "kuta-badung");
  const PIN = kutaPts[Math.floor(kutaPts.length * 0.45)];
  function phoneMap(parent, id) {
    let coast = "";
    for (const [bid, d] of Object.entries(G.coast)) {
      const col = bid === "kuta-badung" ? "#f59e0b" : /legian|seminyak|kerobokan-kelod|canggu|tibubeneng|pererenan/.test(bid) ? "#22c55e" : "#5cc6bf";
      coast += `<path d="${d}" fill="none" stroke="${col}" stroke-width="5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    add(parent, `<svg class="abs" id="${id}" style="left:0;top:0" width="412" height="872"><rect width="412" height="872" fill="#cfe9ea"/>
      <g id="${id}g"><path d="${G.islandFine}" fill="#fbf6ec" stroke="#eadfc8" stroke-width="1.2" vector-effect="non-scaling-stroke"/>${coast}</g></svg>`);
    const pins = [];
    const r = rnd(11);
    const near = G.localPts.filter((p) => Math.hypot(p[0] - kuta[0], p[1] - kuta[1]) < 40 && Math.hypot(p[0] - PIN[0], p[1] - PIN[1]) > 5);
    for (let i = 0; i < 9; i++) {
      const p = near[Math.floor(r() * near.length)];
      const cleaned = i % 3 === 2;
      pins.push({ x: p[0], y: p[1], cleaned });
      add(parent, `<div class="abs" id="${id}p${i}" style="left:-13px;top:-13px;width:26px;height:26px;border-radius:50%;background:${cleaned ? "#22c55e" : "#ff6b4a"};border:4px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.25)"></div>`);
    }
    let view = { cx: kuta[0], cy: kuta[1], z: 7 };
    const pos = (x, y) => [206 + (x - view.cx) * view.z, 436 + (y - view.cy) * view.z];
    return {
      pos,
      set(cx, cy, z, t) {
        view = { cx, cy, z };
        $(id + "g").setAttribute("transform", `translate(${(206 - cx * z).toFixed(2)} ${(436 - cy * z).toFixed(2)}) scale(${z})`);
        pins.forEach((p, i) => { const [x, y] = pos(p.x, p.y); tf(`${id}p${i}`, { x, y, s: 1 + (p.cleaned ? 0 : 0.08 * Math.sin(t * 4 + i)) }); });
      },
    };
  }

  function phoneShell(parent, id, x, y) {
    const el = add(parent, `<div class="abs phone" id="${id}" style="left:${x}px;top:${y}px"><div class="screen" id="${id}s"><div class="notch"></div>
      <div class="status"><span>9:41</span><span>●●● ▮</span></div></div></div>`);
    return $(id + "s");
  }
  function tabbar(parent) {
    add(parent, `<div class="tabbar"><div class="tab on"><i>🗺️</i>Map</div><div class="tab"><i>🏆</i>League</div><div class="tab"><i>🙂</i>Me</div></div>`);
  }

  // ---------- scenes ----------
  const scenes = [];
  function scene(id, start, end, opts, build) {
    const root = add(stage, `<div class="scene" id="${id}"></div>`);
    root.style.zIndex = String(scenes.length + 1);
    const s = { id, start, end, root, pre: opts.pre || 0, iris: opts.iris, render: null };
    s.render = build(root);
    scenes.push(s);
    return s;
  }

  // S1 — intro -------------------------------------------------------------
  scene("s1", 0, 6, {}, (root) => {
    const sea = seaScene(root, "s1");
    add(root, `<div class="abs c" id="s1mark" style="left:860px;top:150px;width:200px;height:200px;filter:drop-shadow(0 24px 40px rgba(11,107,104,.35))">${markSVG("s1m")}</div>`);
    const letters = "Hai Pantai".split("");
    add(root, `<div class="abs" style="left:0;width:${W}px;top:372px;text-align:center;font-weight:900;font-size:170px;letter-spacing:-5px;line-height:1">${letters
      .map((c, i) => `<span class="word" id="s1l${i}" style="color:${i < 3 ? "#12343b" : "#0b6b68"}">${c === " " ? "&nbsp;" : c}</span>`).join("")}</div>`);
    const tag = "Spot trash. <b style='color:#0e9f9a'>Clean&nbsp;it.</b> Help your beach win.";
    const nt = textBlock(root, "s1t", tag, `left:0;width:${W}px;top:585px;text-align:center;font-size:48px;font-weight:800;color:#3d5a60`);
    add(root, `<div class="abs pill" id="s1pill" style="left:810px;top:672px;height:54px;padding:0 26px;background:#fff;font-size:24px;color:#0b6b68;box-shadow:0 10px 30px -10px rgba(18,52,59,.35)"><span class="emoji">🌴</span> A clean-up game for the Bali coast</div>`);
    return (t) => {
      sea(t, A(t, 0, 3.5, E.out));
      const mk = A(t, 0.3, 0.9, E.back2);
      tf("s1mark", { s: mk, r: (1 - mk) * -25, y: 6 * Math.sin(t * 2), op: P(t, 0.3, 0.5) });
      markRender("s1m", t);
      letters.forEach((_, i) => {
        const k = A(t, 0.95 + i * 0.055, 0.9, E.elastic);
        tf(`s1l${i}`, { y: (1 - k) * -160, r: (1 - k) * (i % 2 ? 12 : -12), op: P(t, 0.95 + i * 0.055, 1.1 + i * 0.055) });
      });
      animWords("s1t", nt, t, 2.0, 0.09);
      const pk = A(t, 3.1, 0.7, E.back);
      tf("s1pill", { y: (1 - pk) * 30, s: L(0.8, 1, pk), op: pk });
    };
  });

  // S2 — Bali, the problem, the idea -------------------------------------------
  const s2 = { s0: 0.72, tx0: 718, ty0: 196, s1: 7 };
  scene("s2", 6, 14, {}, (root) => {
    root.style.background = "radial-gradient(circle at 1290px 560px,#dff1ef 0,#fbf6ec 62%)";
    add(root, `<svg class="abs" style="left:0;top:0;opacity:.55" width="${W}" height="${H}"><defs><pattern id="dots" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="#e3d6b8"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#dots)"/></svg>`);
    let coast = "";
    const ids = Object.keys(G.coast);
    ids.forEach((bid, i) => (coast += `<path id="s2c${i}" d="${G.coast[bid]}" pathLength="1" stroke-dasharray="1 1" fill="none" stroke="#0e9f9a" stroke-width="4.2" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>`));
    const r = rnd(5), pins = [];
    for (let i = 0; i < 28; i++) {
      // bias toward the busy south coast
      let p = G.coastPts[Math.floor(r() * G.coastPts.length)];
      if (i % 2 === 0) { const s = G.coastPts.filter((q) => q[1] > 640); p = s[Math.floor(r() * s.length)]; }
      pins.push(p);
    }
    const pinsSvg = pins.map((p, i) => `<g id="s2p${i}" transform="translate(${p[0]} ${p[1]})"><g id="s2pi${i}"><circle r="20" fill="#ff6b4a" opacity=".25" id="s2pg${i}"/><circle r="11" fill="#ff6b4a" stroke="#fff" stroke-width="3.5"/></g></g>`).join("");
    add(root, `<div class="abs" id="s2map" style="left:0;top:0;transform-origin:0 0"><svg width="${G.W}" height="${G.H}" style="overflow:visible;display:block">
      <path d="${G.island}" fill="#ece0c2" transform="translate(5 9)" opacity=".7"/>
      <path d="${G.island}" fill="#f6ead0" stroke="#e5d3ab" stroke-width="0.9"/>${coast}<g>${pinsSvg}</g></svg></div>`);
    const h1 = "Trash keeps washing up on <span class='mark coral' id='s2m1'>Bali's beaches.</span>";
    const n1 = textBlock(root, "s2a", h1, "left:110px;top:300px;width:600px", "h2");
    add(root, `<div class="abs kicker" id="s2k1" style="left:110px;top:250px">The problem</div>`);
    add(root, `<div class="abs kicker" id="s2k2" style="left:110px;top:250px">The idea</div>`);
    const h2 = "Hai Pantai turns cleaning it up into a <span class='mark' id='s2m2'>game.</span>";
    const n2 = textBlock(root, "s2b", h2, "left:110px;top:300px;width:600px", "h2");
    const l2 = `Every coastal village is a beach team. <b style="color:#12343b">${G.nBeaches} of them.</b>`;
    const n3 = textBlock(root, "s2c", l2, "left:110px;top:560px;width:560px", "lead");
    const steps = [["📸", "Report"], ["🧹", "Clean"], ["📈", "Climb"]];
    steps.forEach(([e, l], i) => {
      add(root, `<div class="abs pill card" id="s2s${i}" style="left:${110 + i * 214}px;top:740px;height:76px;padding:0 24px 0 16px;font-size:28px;border-radius:999px"><span class="emoji" style="font-size:34px">${e}</span>${l}</div>`);
      if (i < 2) add(root, `<div class="abs" id="s2ar${i}" style="left:${292 + i * 214}px;top:756px;font-size:34px;font-weight:900;color:#0e9f9a">›</div>`);
    });
    return (t) => {
      const lt = t - 6;
      // map in + zoom out to Kuta
      const mIn = A(lt, 0, 1.2, E.out5);
      const z = A(lt, 7.0, 1.0, E.io);
      const sStart = s2.s0 * L(0.9, 1, mIn);
      const kx = kuta[0], ky = kuta[1];
      const f0x = s2.tx0 + sStart * kx, f0y = s2.ty0 + sStart * ky + (1 - mIn) * 40;
      const s = sStart * Math.pow(s2.s1 / sStart, z);
      const fx = L(f0x, 1380, z), fy = L(f0y, 540, z);
      tf("s2map", { x: fx - s * kx, y: fy - s * ky, s, op: mIn });
      // coastline draw
      const n = Object.keys(G.coast).length;
      for (let i = 0; i < n; i++) {
        const k = A(lt, 0.5 + (i / n) * 1.6, 0.6, E.out);
        $(`s2c${i}`).setAttribute("stroke-dashoffset", (1 - k).toFixed(3));
      }
      // pins pop
      for (let i = 0; i < 28; i++) {
        const k = A(lt, 2.4 + i * 0.055, 0.45, E.back2);
        const g = $(`s2pi${i}`);
        g.setAttribute("transform", `scale(${(k * (1 + 0.1 * Math.sin(lt * 5 + i))).toFixed(3)})`);
        $(`s2pg${i}`).setAttribute("r", (16 + 14 * ((lt * 1.2 + i * 0.13) % 1)).toFixed(1));
        $(`s2pg${i}`).setAttribute("opacity", (0.35 * (1 - ((lt * 1.2 + i * 0.13) % 1))).toFixed(2));
      }
      // words
      const ka = inOut(lt, 0.5, 0.5, 4.0, 0.3);
      tf("s2k1", { y: (1 - A(lt, 0.4, 0.5)) * 20, op: ka });
      animWords("s2a", n1, lt, 0.6, 0.07, 4.0);
      markIn("s2m1", lt, 2.6);
      tf("s2k2", { y: (1 - A(lt, 4.4, 0.5)) * 20, op: inOut(lt, 4.4, 0.5, 6.9, 0.3) });
      animWords("s2b", n2, lt, 4.5, 0.07, 6.9);
      markIn("s2m2", lt, 5.3);
      animWords("s2c", n3, lt, 5.0, 0.05, 6.9, 30);
      for (let i = 0; i < 3; i++) {
        const k = A(lt, 5.6 + i * 0.4, 0.6, E.back2), x = A(lt, 6.8 + i * 0.05, 0.3, E.in);
        tf(`s2s${i}`, { y: (1 - k) * 40 - x * 30, s: L(0.6, 1, k), op: k * (1 - x) });
        if (i < 2) op(`s2ar${i}`, A(lt, 5.9 + i * 0.4, 0.3) * (1 - x));
      }
    };
  });

  // Step tracker (overlay) -----------------------------------------------------
  const tracker = add(stage, `<div class="abs" id="trk" style="left:110px;top:56px;z-index:90;display:flex;gap:12px"></div>`);
  ["1  Report", "2  Clean", "3  Climb"].forEach((l, i) =>
    add(tracker, `<div class="pill" id="trk${i}" style="height:50px;padding:0 22px;font-size:21px;background:#fff;color:#5d7377;box-shadow:0 6px 18px -8px rgba(18,52,59,.3);white-space:pre"><b id="trkn${i}" style="display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#f3ecdd;font-size:16px">${i + 1}</b>${l.slice(3)}</div>`));
  function renderTracker(t) {
    const vis = inOut(t, 14.3, 0.5, 57.3, 0.3);
    tf(tracker, { x: t >= 26 && t < 38 ? 850 : 0, y: (1 - vis) * -30, op: vis });
    const active = t < 26 ? 0 : t < 38 ? 1 : 2;
    for (let i = 0; i < 3; i++) {
      const on = i === active, done = i < active;
      const el = $(`trk${i}`), n = $(`trkn${i}`);
      el.style.background = on ? "#0e9f9a" : "#fff";
      el.style.color = on ? "#fff" : done ? "#0b6b68" : "#5d7377";
      n.style.background = on ? "rgba(255,255,255,.25)" : done ? "#dcfce7" : "#f3ecdd";
      n.textContent = done ? "✓" : String(i + 1);
      const sw = [26, 38][i - 1];
      const pop = i > 0 ? A(t, sw, 0.5, E.back2) * (1 - A(t, sw + 0.5, 0.4)) : 0;
      tf(el, { s: 1 + pop * 0.15 });
    }
  }

  // S3 — Report ------------------------------------------------------------------
  scene("s3", 14, 26, { pre: 0.45, iris: [1380, 540] }, (root) => {
    root.style.background = "#fbf6ec";
    add(root, `<div class="abs" style="left:1060px;top:-120px;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,#e3f3f1 0,rgba(227,243,241,0) 70%)"></div>`);
    add(root, `<div class="abs kicker" id="s3k" style="left:120px;top:190px">Step 1</div>`);
    add(root, `<div class="abs h1" id="s3h" style="left:116px;top:228px"><span class="mark coral" id="s3hm">Report it.</span></div>`);
    const lead = "See trash on the beach? Snap a photo and drop a pin.";
    const nl = textBlock(root, "s3l", lead, "left:120px;top:350px;width:760px", "lead");
    const bullets = [
      ["🤖", "#e6f5f4", "<b>Claude AI</b> looks at the photo and tags it: <span style='color:#0b6b68'>what kind, how much</span>"],
      ["📍", "#ffe7e1", "The pin <b>snaps to the nearest beach</b>, so the report counts for that beach"],
    ];
    bullets.forEach(([e, bg, h], i) => add(root, `<div class="abs bullet" id="s3b${i}" style="left:120px;top:${490 + i * 110}px;width:780px"><div class="ic emoji" style="background:${bg}">${e}</div><div style="font-weight:700">${h}</div></div>`));
    add(root, `<div class="abs" id="s3pts" style="left:120px;top:720px;width:800px"><div class="bullet"><div class="ic emoji" style="background:#fef3c7">⭐</div><div><b>You earn points</b> — bigger piles, more points</div></div></div>`);
    [["A handful", 10, "S"], ["A bag", 20, "M"], ["More than a bag", 40, "L"]].forEach(([l, p, s], i) =>
      add(root, `<div class="abs card" id="s3sz${i}" style="left:${212 + [0, 200, 400][i]}px;top:818px;padding:14px 22px;border-radius:22px;width:${[180, 180, 250][i]}px"><div style="font-size:19px;font-weight:800;color:#5d7377">${l}</div><div style="font-size:40px;font-weight:900;color:#0e9f9a;line-height:1.1">+${p}<span style="font-size:20px"> pts</span></div></div>`));

    const scr = phoneShell(root, "s3ph", 1160, 90);
    const map = phoneMap(scr, "s3map");
    add(scr, `<div class="abs" id="s3ban" style="left:16px;top:62px;z-index:20;background:rgba(255,255,255,.96);border-radius:18px;padding:10px 14px;box-shadow:0 6px 16px rgba(0,0,0,.14)">
      <div style="font-weight:900;font-size:16px;white-space:nowrap"><span class="emoji">🧹</span> <span style="color:#0b6b68">23</span> <span style="color:#5d7377">/ 50 cleaned this week</span></div>
      <div style="margin-top:6px;height:6px;border-radius:9px;background:#e6f5f4"><div style="width:46%;height:100%;border-radius:9px;background:#0e9f9a"></div></div></div>`);
    add(scr, `<div class="abs" id="s3newpin" style="left:-20px;top:-46px;width:40px;height:52px;z-index:12">
      <svg viewBox="0 0 40 52" width="40" height="52"><path d="M20 51C20 51 38 30 38 19A18 18 0 0 0 2 19C2 30 20 51 20 51Z" fill="#ff6b4a" stroke="#fff" stroke-width="3"/><circle cx="20" cy="19" r="7" fill="#fff"/></svg></div>`);
    add(scr, `<div class="abs" id="s3pinring" style="left:-30px;top:-30px;width:60px;height:60px;border-radius:50%;border:4px solid #ff6b4a;z-index:11"></div>`);
    add(scr, `<svg class="abs" id="s3snap" style="left:0;top:0;z-index:11" width="412" height="872"><path id="s3snapl" stroke="#0b6b68" stroke-width="3" stroke-dasharray="6 6" fill="none"/></svg>`);
    add(scr, `<div class="abs" id="s3rb" style="left:76px;top:690px;z-index:20;height:64px;width:260px;border-radius:99px;background:#ff6b4a;color:#fff;font-weight:900;font-size:21px;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 14px 30px -8px rgba(255,107,74,.6),0 0 0 5px rgba(255,255,255,.7)"><span class="emoji">📷</span> Report trash</div>`);
    tabbar(scr);
    // report sheet
    add(scr, `<div class="sheet" id="s3sh" style="height:724px">
      <div class="grab"></div><div style="font-size:27px;font-weight:900">Report trash</div>
      <div id="s3vf" style="position:relative;margin-top:14px;height:236px;border-radius:22px;overflow:hidden;background:#123">${trashArt(false, "s3art")}
        <div id="s3vfc" style="position:absolute;inset:14px;border:0 solid #fff;"><div style="position:absolute;left:0;top:0;width:34px;height:34px;border-left:5px solid #fff;border-top:5px solid #fff;border-radius:8px 0 0 0"></div><div style="position:absolute;right:0;top:0;width:34px;height:34px;border-right:5px solid #fff;border-top:5px solid #fff;border-radius:0 8px 0 0"></div><div style="position:absolute;left:0;bottom:0;width:34px;height:34px;border-left:5px solid #fff;border-bottom:5px solid #fff;border-radius:0 0 0 8px"></div><div style="position:absolute;right:0;bottom:0;width:34px;height:34px;border-right:5px solid #fff;border-bottom:5px solid #fff;border-radius:0 0 8px 0"></div></div>
        <div id="s3scan" style="position:absolute;left:0;right:0;height:70px;top:0;background:linear-gradient(180deg,rgba(14,159,154,0),rgba(14,159,154,.55));border-bottom:3px solid #6ff3ea"></div>
        <div id="s3flash" style="position:absolute;inset:0;background:#fff"></div></div>
      <div id="s3gA" style="position:absolute;left:22px;right:22px;top:330px;text-align:center">
        <div style="font-weight:900;font-size:19px">Snap the trash you see on the beach.</div><div style="font-weight:700;font-size:16px;color:#5d7377;margin-top:4px">Claude will help you tag it.</div>
        <div id="s3shut" style="margin:34px auto 0;width:96px;height:96px;border-radius:50%;border:6px solid #0e9f9a;padding:6px"><div style="width:100%;height:100%;border-radius:50%;background:#0e9f9a"></div></div></div>
      <div id="s3busy" style="position:absolute;left:22px;right:22px;top:330px;display:flex;align-items:center;gap:12px;font-weight:900;font-size:18px;color:#0b6b68"><span id="s3spin" style="width:24px;height:24px;border-radius:50%;border:4px solid #e6f5f4;border-top-color:#0e9f9a"></span>Claude is looking at your photo…</div>
      <div id="s3gB" style="position:absolute;left:22px;right:22px;top:326px">
        <div style="font-size:17px;font-weight:700"><b style="color:#0b6b68">Claude sees:</b> plastic bottles, a bag and a can</div>
        <div style="margin-top:14px;font-size:15px;font-weight:900;color:#5d7377">What kind?</div>
        <div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:7px">${["Plastic", "Bottles", "Nets", "Organic", "Mixed"].map((c, i) => `<span class="chip" id="s3ck${i}">${c}</span>`).join("")}</div>
        <div style="margin-top:12px;font-size:15px;font-weight:900;color:#5d7377">How much?</div>
        <div style="display:flex;gap:7px;margin-top:7px">${["A handful", "A bag", "More than a bag"].map((c, i) => `<span class="chip" id="s3cs${i}">${c}</span>`).join("")}</div>
        <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center;background:#e6f5f4;border-radius:16px;padding:12px 16px;font-weight:800;color:#0b6b68">You'll earn <b style="font-size:24px;font-weight:900">+20</b></div>
        <div class="btn" id="s3next" style="margin-top:14px">Next: place the pin</div></div>
    </div>`);
    add(scr, `<div class="abs" id="s3pc" style="left:14px;right:14px;top:58px;z-index:36;background:#fff;border-radius:24px;padding:14px 16px;box-shadow:0 10px 30px rgba(18,52,59,.2);display:flex;align-items:center;gap:12px">
      <span class="emoji" style="font-size:28px">📍</span><div><div style="font-weight:900;font-size:17px">Tap the map where the trash is</div><div style="font-weight:800;font-size:15px;color:#5d7377">Beach: <b id="s3bn" style="color:#0b6b68">Finding the coast…</b></div></div></div>`);
    add(scr, `<div class="abs btn" id="s3send" style="left:22px;right:22px;top:770px;z-index:36;box-shadow:0 14px 30px -10px rgba(14,159,154,.7)">Send report</div>`);
    add(scr, `<div class="abs" id="s3dim" style="inset:0;background:rgba(18,52,59,.35);z-index:60"></div>`);
    add(scr, `<div class="abs card" id="s3toast" style="left:46px;top:280px;width:320px;padding:28px 20px;text-align:center;z-index:70">
      <div style="font-size:92px;font-weight:900;line-height:1;background:linear-gradient(135deg,#0e9f9a,#22c55e);-webkit-background-clip:text;color:transparent" id="s3tn">+20</div>
      <div style="font-weight:900;font-size:22px;margin-top:6px">Thanks for reporting!</div>
      <div style="margin-top:10px" class="pill"><span style="background:#fef3c7;color:#92400e;border-radius:99px;padding:6px 14px;font-size:15px"><span class="emoji">📍</span> Badge: First report</span></div></div>`);
    const conf = confetti(scr, "s3cf", 46, 21);
    const tap = tapUI(scr, "s3tap");

    return (t) => {
      const lt = t - 14;
      // left text
      tf("s3k", { y: (1 - A(lt, 0.3, 0.5)) * 20, op: A(lt, 0.3, 0.5) });
      const hk = A(lt, 0.4, 0.7, E.out5);
      tf("s3h", { y: (1 - hk) * 60, op: hk });
      markIn("s3hm", lt, 1.0);
      animWords("s3l", nl, lt, 0.9, 0.05);
      for (let i = 0; i < 2; i++) { const k = A(lt, [4.6, 6.9][i], 0.6, E.back); tf(`s3b${i}`, { x: (1 - k) * -40, op: k }); }
      { const k = A(lt, 8.7, 0.6, E.back); tf("s3pts", { x: (1 - k) * -40, op: k }); }
      for (let i = 0; i < 3; i++) { const k = A(lt, 9.1 + i * 0.22, 0.6, E.back2); tf(`s3sz${i}`, { y: (1 - k) * 30, s: L(0.7, 1, k), op: k }); }

      // phone
      const pk = A(lt, -0.4, 1.0, E.out5);
      tf("s3ph", { y: (1 - pk) * 80 + 6 * Math.sin(lt * 1.4), r: (1 - pk) * 4 + 0.6 * Math.sin(lt * 0.9), s: 1.12 });
      // map view: slow drift, then frame the pin
      const pinK = A(lt, 6.0, 0.8, E.io);
      const cx = L(kuta[0] - 1.5 + lt * 0.25, PIN[0] + 4, pinK), cy = L(kuta[1] + 2 - lt * 0.2, PIN[1] - 6, pinK);
      map.set(cx, cy, L(7, 8.5, pinK), lt);
      // report button
      const rbOut = A(lt, 2.5, 0.3), rbBack = A(lt, 10.4, 0.5, E.back);
      const press = A(lt, 2.32, 0.08) * (1 - A(lt, 2.45, 0.15));
      tf("s3rb", { s: (1 - 0.07 * press) * (1 + 0.03 * Math.sin(lt * 5) * (1 - rbOut)), y: (rbOut - rbBack) * 140, op: 1 });
      // sheet
      const shIn = A(lt, 2.55, 0.55, E.out5), shOut = A(lt, 6.0, 0.45, E.in);
      tf("s3sh", { y: (1 - shIn + shOut) * 760 });
      op("s3gA", 1 - A(lt, 3.85, 0.2));
      tf("s3shut", { s: 1 - 0.1 * (A(lt, 3.55, 0.08) * (1 - A(lt, 3.7, 0.15))) });
      op("s3flash", A(lt, 3.75, 0.05) * (1 - A(lt, 3.85, 0.35)));
      op("s3vfc", 1 - A(lt, 3.8, 0.1));
      const sc = P(lt, 4.0, 4.9);
      tf("s3scan", { y: L(-70, 236, (sc * 2) % 1), op: lt > 4.0 && lt < 4.9 ? 1 : 0 });
      op("s3busy", inOut(lt, 3.95, 0.2, 4.75, 0.15));
      $("s3spin").style.transform = `rotate(${lt * 720}deg)`;
      op("s3gB", A(lt, 4.8, 0.25));
      [1].forEach((i) => { const k = A(lt, 5.05, 0.35, E.back2); const el = $(`s3ck${i}`); el.className = "chip" + (k > 0.2 ? " on" : ""); tf(el, { s: 1 + 0.25 * Math.sin(k * Math.PI) }); });
      { const k = A(lt, 5.35, 0.35, E.back2); const el = $("s3cs1"); el.className = "chip" + (k > 0.2 ? " on" : ""); tf(el, { s: 1 + 0.25 * Math.sin(k * Math.PI) }); }
      tf("s3next", { s: 1 - 0.06 * (A(lt, 5.8, 0.08) * (1 - A(lt, 5.92, 0.15))) });
      // pin step
      op("s3pc", inOut(lt, 6.3, 0.35, 8.4, 0.3)); tf("s3pc", { y: (1 - A(lt, 6.3, 0.45, E.back)) * -40, op: inOut(lt, 6.3, 0.35, 8.4, 0.3) });
      txt("s3bn", lt > 7.25 ? "Kuta" : "Finding the coast…");
      const [px, py] = map.pos(PIN[0], PIN[1]);
      const off = [-26, 0];
      const drop = A(lt, 6.75, 0.5, E.elastic), snap = A(lt, 7.2, 0.45, E.io);
      const nx = px + off[0] * (1 - snap), ny = py + off[1] * (1 - snap);
      tf("s3newpin", { x: nx, y: ny - (1 - drop) * 120, s: lt > 8.4 ? 1 + 0.06 * Math.sin(lt * 6) : 1, op: P(lt, 6.75, 6.85) });
      $("s3snapl").setAttribute("d", `M${px + off[0]} ${py}L${px} ${py}`);
      op("s3snap", inOut(lt, 7.15, 0.15, 7.75, 0.3));
      const ringK = ((lt - 7.6) * 0.9) % 1;
      tf("s3pinring", { x: px, y: py, s: 0.4 + ringK * 1.6, op: lt > 7.6 ? (1 - ringK) * 0.8 : 0 });
      const sendK = inOut(lt, 7.75, 0.4, 8.45, 0.2);
      tf("s3send", { y: (1 - A(lt, 7.75, 0.45, E.back)) * 120, s: 1 - 0.06 * (A(lt, 8.22, 0.08) * (1 - A(lt, 8.35, 0.15))), op: sendK });
      // toast
      const tk = A(lt, 8.5, 0.55, E.back2), tOut = A(lt, 10.2, 0.35, E.in);
      tf("s3toast", { s: L(0.5, 1, tk) * (1 - tOut * 0.3), y: tOut * -40, op: tk * (1 - tOut) });
      op("s3dim", inOut(lt, 8.45, 0.3, 10.2, 0.3));
      const cnt = Math.round(L(0, 20, A(lt, 8.55, 0.5)));
      txt("s3tn", "+" + cnt);
      conf(lt, 8.55, 206, 360, 0.55);
      // taps
      if (lt < 3) tap(lt, 2.4, 206, 722);
      else if (lt < 4.5) tap(lt, 3.62, 206, 512);
      else if (lt < 6.2) tap(lt, 5.85, 206, 830);
      else if (lt < 7.3) tap(lt, 6.72, px + off[0], py);
      else tap(lt, 8.28, 206, 801);
    };
  });

  // S4 — Clean --------------------------------------------------------------------
  scene("s4", 26, 38, {}, (root) => {
    root.style.background = "#fbf6ec";
    add(root, `<div class="abs" style="left:-120px;top:120px;width:1000px;height:1000px;border-radius:50%;background:radial-gradient(circle,#e3f3f1 0,rgba(227,243,241,0) 70%)"></div>`);
    const X = 960;
    add(root, `<div class="abs kicker" id="s4k" style="left:${X}px;top:150px">Step 2</div>`);
    add(root, `<div class="abs h1" id="s4h" style="left:${X - 4}px;top:188px"><span class="mark" id="s4hm">Clean it.</span></div>`);
    const lead = "Anyone can clean any open report. Pick it up, then snap an “after” photo.";
    const nl = textBlock(root, "s4l", lead, `left:${X}px;top:310px;width:820px`, "lead");
    add(root, `<div class="abs bullet" id="s4b0" style="left:${X}px;top:448px;width:860px"><div class="ic emoji" style="background:#e6f5f4">🤖</div><div style="font-weight:700"><b>Claude compares</b> before &amp; after and gives a <b style="color:#0b6b68">clean score</b> out of 100</div></div>`);
    add(root, `<div class="abs pill" id="s4note" style="left:${X + 92}px;top:548px;height:50px;padding:0 20px;background:#ffe7e1;color:#b83a1e;font-size:21px">Score under 40? The report stays open. Try again.</div>`);
    // equation card
    add(root, `<div class="abs card" id="s4eq" style="left:${X}px;top:630px;width:860px;height:330px;padding:28px 34px"><div style="font-size:20px;font-weight:900;color:#5d7377;letter-spacing:2px;text-transform:uppercase">Your clean points</div></div>`);
    const tok = (id, x, big, small, col = "#12343b", bg = "#f3ecdd") => add($("s4eq"), `<div class="abs" id="${id}" style="left:${x}px;top:76px;text-align:center"><div style="min-width:120px;padding:10px 16px;border-radius:20px;background:${bg};font-size:50px;font-weight:900;color:${col};line-height:1.1">${big}</div><div style="margin-top:8px;font-size:18px;font-weight:800;color:#5d7377">${small}</div></div>`);
    const opx = (id, x, s) => add($("s4eq"), `<div class="abs" id="${id}" style="left:${x}px;top:90px;font-size:46px;font-weight:900;color:#5d7377">${s}</div>`);
    tok("s4t0", 34, "30", "base"); opx("s4o0", 172, "×");
    tok("s4t1", 212, "2", "a bag"); opx("s4o1", 350, "×");
    tok("s4t2", 390, "92%", "clean score"); opx("s4o2", 560, "=");
    tok("s4t3", 604, "<span id='s4res'>55</span>", "points", "#fff", "#0e9f9a");
    add($("s4eq"), `<div class="abs pill" id="s4hot" style="left:34px;top:232px;height:62px;padding:0 22px;background:linear-gradient(90deg,#fef3c7,#ffe7e1);color:#92400e;font-size:24px"><span class="emoji" style="font-size:30px">🔥</span><span>Hotspot? <b>Points ×2</b></span></div>`);
    add($("s4eq"), `<div class="abs" id="s4hotx" style="left:378px;top:236px;width:440px;font-size:18px;font-weight:700;color:#5d7377;line-height:1.3">A hotspot is more than a bag, or trash left open for 48&nbsp;hours or more.</div>`);

    const scr = phoneShell(root, "s4ph", 300, 90);
    const map = phoneMap(scr, "s4map");
    tabbar(scr);
    add(scr, `<div class="abs" style="inset:0;background:rgba(18,52,59,.18);z-index:31"></div>`);
    add(scr, `<div class="sheet" id="s4sh" style="height:780px">
      <div class="grab"></div>
      <div id="s4photo" style="position:relative;height:250px;border-radius:22px;overflow:hidden">
        <div style="position:absolute;inset:0">${trashArt(true, "s4after")}</div>
        <div id="s4before" style="position:absolute;inset:0;overflow:hidden"><div style="position:absolute;left:0;top:0;width:368px;height:250px">${trashArt(false, "s4art")}</div></div>
        <div id="s4div" style="position:absolute;top:0;bottom:0;width:5px;margin-left:-2px;background:#fff;box-shadow:0 0 12px rgba(0,0,0,.3)"></div>
        <div id="s4lb" class="pill" style="position:absolute;left:12px;bottom:12px;background:rgba(18,52,59,.75);color:#fff;font-size:14px;padding:4px 12px">Before</div>
        <div id="s4la" class="pill" style="position:absolute;right:12px;bottom:12px;background:rgba(18,52,59,.75);color:#fff;font-size:14px;padding:4px 12px">After</div>
        <div id="s4scan" style="position:absolute;left:0;right:0;height:80px;top:0;background:linear-gradient(180deg,rgba(14,159,154,0),rgba(14,159,154,.55));border-bottom:3px solid #6ff3ea"></div>
        <div id="s4vfc" style="position:absolute;inset:14px"><div style="position:absolute;left:0;top:0;width:34px;height:34px;border-left:5px solid #fff;border-top:5px solid #fff;border-radius:8px 0 0 0"></div><div style="position:absolute;right:0;top:0;width:34px;height:34px;border-right:5px solid #fff;border-top:5px solid #fff;border-radius:0 8px 0 0"></div><div style="position:absolute;left:0;bottom:0;width:34px;height:34px;border-left:5px solid #fff;border-bottom:5px solid #fff;border-radius:0 0 0 8px"></div><div style="position:absolute;right:0;bottom:0;width:34px;height:34px;border-right:5px solid #fff;border-bottom:5px solid #fff;border-radius:0 0 8px 0"></div></div>
        <div id="s4flash" style="position:absolute;inset:0;background:#fff"></div>
        <div id="s4st" class="pill" style="position:absolute;left:12px;top:12px;padding:5px 12px;font-size:15px;background:#ff6b4a;color:#fff">Open</div>
        <div id="s4st2" class="pill" style="position:absolute;left:12px;top:12px;padding:5px 12px;font-size:15px;background:#22c55e;color:#fff">✓ Cleaned</div>
        <div id="s4hs" class="pill" style="position:absolute;right:12px;top:12px;padding:5px 12px;font-size:15px;background:#f59e0b;color:#fff;box-shadow:0 0 0 0 rgba(245,158,11,.6)"><span class="emoji">🔥</span> Hotspot</div>
      </div>
      <div style="margin-top:16px;font-size:26px;font-weight:900">Bottles · A bag</div>
      <div style="margin-top:2px;font-size:16px;font-weight:700;color:#5d7377"><span class="emoji">📍</span> Kuta · reported 2 days ago by <span class="emoji">🐢</span> Komang</div>
      <div id="s4p1" style="position:absolute;left:22px;right:22px;top:400px">
        <div class="btn" id="s4btn" style="height:70px;font-size:23px"><span class="emoji">✨</span> I cleaned this</div>
        <div style="margin-top:14px;font-size:16px;font-weight:700;color:#5d7377;text-align:center">Picked it up? Prove it with an after photo.</div></div>
      <div id="s4p2" style="position:absolute;left:22px;right:22px;top:400px;text-align:center">
        <div style="font-size:17px;font-weight:800">Take an “after” photo of the same spot, so Claude can see it's clean.</div>
        <div id="s4shut" style="margin:22px auto 0;width:92px;height:92px;border-radius:50%;border:6px solid #0e9f9a;padding:6px"><div style="width:100%;height:100%;border-radius:50%;background:#0e9f9a"></div></div></div>
      <div id="s4p3" style="position:absolute;left:22px;right:22px;top:400px;display:flex;align-items:center;gap:12px;font-weight:900;font-size:18px;color:#0b6b68"><span id="s4spin" style="width:24px;height:24px;border-radius:50%;border:4px solid #e6f5f4;border-top-color:#0e9f9a"></span>Claude is comparing the photos…</div>
      <div id="s4p4" style="position:absolute;left:22px;right:22px;top:396px;background:#dcfce7;border-radius:22px;padding:18px 20px;color:#15803d">
        <div style="display:flex;align-items:center;gap:18px">
          <svg width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r="40" fill="none" stroke="#bbf7d0" stroke-width="10"/><circle id="s4ring" cx="48" cy="48" r="40" fill="none" stroke="#22c55e" stroke-width="10" stroke-linecap="round" pathLength="100" stroke-dasharray="100 100" transform="rotate(-90 48 48)"/><text id="s4sc" x="48" y="58" text-anchor="middle" font-size="30" font-weight="900" fill="#15803d">0</text></svg>
          <div><div style="font-size:16px;font-weight:900;text-transform:uppercase;letter-spacing:1px">Clean score</div><div style="font-size:22px;font-weight:900;color:#12343b">Spot looks clear of trash</div><div style="font-size:15px;font-weight:800;margin-top:4px">✓ Checked by Claude</div></div></div></div>
    </div>`);
    add(scr, `<div class="abs" id="s4dim" style="inset:0;background:rgba(18,52,59,.35);z-index:60"></div>`);
    add(scr, `<div class="abs card" id="s4toast" style="left:36px;top:250px;width:340px;padding:28px 20px;text-align:center;z-index:70">
      <div style="font-size:96px;font-weight:900;line-height:1;background:linear-gradient(135deg,#0e9f9a,#22c55e);-webkit-background-clip:text;color:transparent" id="s4tn">+110</div>
      <div style="font-weight:900;font-size:22px;margin-top:6px">Thanks for cleaning!</div>
      <div style="margin-top:10px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap"><span class="pill" style="background:#fef3c7;color:#92400e;padding:6px 12px;font-size:14px"><span class="emoji">🔥</span> Hotspot hunter</span><span class="pill" style="background:#e6f5f4;color:#0b6b68;padding:6px 12px;font-size:14px"><span class="emoji">🧹</span> First clean</span></div></div>`);
    const conf = confetti(scr, "s4cf", 56, 33);
    const conf2 = confetti(root, "s4cf2", 30, 44);
    const tap = tapUI(scr, "s4tap");
    return (t) => {
      const lt = t - 26;
      tf("s4k", { y: (1 - A(lt, 0.3, 0.5)) * 20, op: A(lt, 0.3, 0.5) });
      const hk = A(lt, 0.4, 0.7, E.out5);
      tf("s4h", { y: (1 - hk) * 60, op: hk });
      markIn("s4hm", lt, 1.0);
      animWords("s4l", nl, lt, 0.9, 0.045);
      { const k = A(lt, 4.0, 0.6, E.back); tf("s4b0", { x: (1 - k) * 40, op: k }); }
      { const k = A(lt, 5.5, 0.5, E.back); tf("s4note", { x: (1 - k) * 40, op: k }); }
      { const k = A(lt, 5.8, 0.7, E.out5); tf("s4eq", { y: (1 - k) * 80, op: k }); }
      for (let i = 0; i < 4; i++) {
        const k = A(lt, 6.1 + i * 0.35, 0.5, E.back2);
        tf(`s4t${i}`, { y: (1 - k) * 30, s: L(0.5, 1, k) * (i === 3 ? 1 + 0.15 * A(lt, 8.2, 0.2) * (1 - A(lt, 8.4, 0.4)) : 1), op: k });
        if (i < 3) op(`s4o${i}`, A(lt, 6.25 + i * 0.35, 0.3));
      }
      txt("s4res", String(Math.round(lt < 8.0 ? L(0, 55, A(lt, 7.15, 0.5)) : L(55, 110, A(lt, 8.0, 0.6)))));
      { const k = A(lt, 7.6, 0.55, E.back2); tf("s4hot", { x: (1 - k) * -30, s: L(0.6, 1, k) * (1 + 0.04 * Math.sin(lt * 8) * k), op: k }); }
      op("s4hotx", A(lt, 7.9, 0.5));
      conf2(lt, 8.05, X + 680, 760, 0.5);

      const pk = A(lt, 0, 0.9, E.out5);
      tf("s4ph", { x: (1 - pk) * -700, r: (1 - pk) * -8 + 0.6 * Math.sin(lt * 0.9), y: 6 * Math.sin(lt * 1.4), s: 1.12 });
      map.set(PIN[0] + 4, PIN[1] + 18, 8.5, lt);
      tf("s4sh", { y: (1 - A(lt, 0.4, 0.6, E.out5)) * 800 });
      // phase 1: button
      tf("s4btn", { s: (1 - 0.06 * (A(lt, 1.52, 0.08) * (1 - A(lt, 1.65, 0.15)))) * (1 + 0.025 * Math.sin(lt * 5)) });
      op("s4p1", 1 - A(lt, 1.75, 0.2));
      op("s4p2", inOut(lt, 1.85, 0.25, 2.75, 0.2));
      tf("s4shut", { s: 1 - 0.1 * (A(lt, 2.52, 0.08) * (1 - A(lt, 2.65, 0.15))) });
      // photo: before → live after viewfinder → compare wipe
      const live = lt > 1.9 && lt < 2.7;
      const wipe = A(lt, 3.0, 1.0, E.io);
      $("s4before").style.width = (live ? 0 : lt < 3.0 ? 368 : 368 * (1 - wipe)).toFixed(1) + "px";
      tf("s4div", { x: 368 * (1 - wipe), op: lt > 2.95 && lt < 4.3 ? 1 : 0 });
      op("s4lb", inOut(lt, 3.0, 0.2, 4.4, 0.3)); op("s4la", inOut(lt, 3.0, 0.2, 4.4, 0.3));
      op("s4vfc", live ? 1 : 0);
      op("s4flash", A(lt, 2.62, 0.05) * (1 - A(lt, 2.7, 0.35)));
      const sc = P(lt, 4.0, 5.0);
      tf("s4scan", { y: L(-80, 250, (sc * 2) % 1), op: lt > 4.0 && lt < 5.0 ? 1 : 0 });
      op("s4p3", inOut(lt, 2.9, 0.2, 4.95, 0.15));
      $("s4spin").style.transform = `rotate(${lt * 720}deg)`;
      const rk = A(lt, 5.0, 0.4, E.back);
      tf("s4p4", { s: L(0.85, 1, rk), op: rk });
      const score = Math.round(L(0, 92, A(lt, 5.1, 0.8, E.out)));
      txt("s4sc", String(score));
      $("s4ring").setAttribute("stroke-dasharray", `${score} 100`);
      op("s4st", 1 - A(lt, 5.6, 0.2));
      { const k = A(lt, 5.6, 0.4, E.back2); tf("s4st2", { s: L(0.5, 1, k), op: k }); }
      { const pulse = (lt * 1.5) % 1; $("s4hs").style.boxShadow = `0 0 0 ${(pulse * 12).toFixed(1)}px rgba(245,158,11,${(0.6 * (1 - pulse)).toFixed(2)})`; }
      // toast
      const tk = A(lt, 8.6, 0.55, E.back2), tOut = A(lt, 11.2, 0.3, E.in);
      tf("s4toast", { s: L(0.5, 1, tk), op: tk * (1 - tOut) });
      op("s4dim", inOut(lt, 8.55, 0.3, 11.2, 0.3));
      txt("s4tn", "+" + Math.round(L(0, 110, A(lt, 8.65, 0.7))));
      conf(lt, 8.65, 206, 330, 0.6);
      if (lt < 2) tap(lt, 1.6, 206, 152 + 92 + 400 + 35);
      else tap(lt, 2.58, 206, 92 + 400 + 70 + 46);
    };
  });

  // S5 — Beach health ----------------------------------------------------------------
  const drops = [["S", 5, "🥤", "A handful"], ["M", 10, "🧴", "A bag"], ["L", 20, "🛍️", "More than a bag"], ["M", 10, "🥫", "A bag"], ["L", 20, "🕸️", "More than a bag"]];
  const dropT = [1.8, 2.6, 3.4, 4.2, 4.9];
  const cleanT = [5.9, 6.5, 7.1, 7.7, 8.3];
  const healthCol = (h) => (h >= 80 ? ["#22c55e", "#15803d", "#dcfce7"] : h >= 50 ? ["#f59e0b", "#92400e", "#fef3c7"] : ["#ff6b4a", "#b83a1e", "#ffe7e1"]);
  scene("s5", 38, 48, {}, (root) => {
    root.style.background = "#fbf6ec";
    add(root, `<div class="abs kicker" id="s5k" style="left:120px;top:140px">Step 3 · Climb</div>`);
    const h1 = "Every open report <span class='mark coral' id='s5m1'>hurts its beach.</span>";
    const n1 = textBlock(root, "s5a", h1, "left:116px;top:180px;width:1700px", "h2");
    const h2 = "Clean it up, and the beach <span class='mark' id='s5m2'>bounces back.</span>";
    const n2 = textBlock(root, "s5b", h2, "left:116px;top:180px;width:1700px", "h2");
    add(root, `<div class="abs card" id="s5card" style="left:150px;top:300px;width:700px;height:680px;border-radius:48px"></div>`);
    add(root, `<svg class="abs" id="s5ringsvg" style="left:250px;top:330px" width="500" height="500" viewBox="0 0 500 500">
      <circle cx="250" cy="250" r="205" fill="none" stroke="#f3ecdd" stroke-width="44"/>
      <circle id="s5ring" cx="250" cy="250" r="205" fill="none" stroke="#22c55e" stroke-width="44" stroke-linecap="round" pathLength="100" stroke-dasharray="100 100" transform="rotate(-90 250 250)"/></svg>`);
    add(root, `<div class="abs" id="s5num" style="left:250px;top:470px;width:500px;text-align:center;font-size:170px;font-weight:900;line-height:1;letter-spacing:-6px">100</div>`);
    add(root, `<div class="abs" style="left:250px;top:430px;width:500px;text-align:center;font-size:24px;font-weight:900;color:#5d7377;letter-spacing:3px">HEALTH</div>`);
    add(root, `<div class="abs" style="left:150px;top:850px;width:700px;text-align:center"><div style="font-size:44px;font-weight:900"><span class="emoji">🏖️</span> Kuta</div></div>`);
    add(root, `<div class="abs pill" id="s5st" style="left:0;top:918px;height:44px;padding:0 18px;font-size:20px"></div>`);
    // formula
    add(root, `<div class="abs card" id="s5f" style="left:990px;top:300px;width:810px;padding:26px 34px"><div style="font-size:46px;font-weight:900;letter-spacing:-1px">Health = 100 <span style="color:#ff6b4a">−</span> open trash</div>
      <div style="display:flex;gap:12px;margin-top:16px">${[["A handful", 5], ["A bag", 10], ["More than a bag", 20]].map(([l, w]) => `<span class="pill" style="background:#f3ecdd;padding:8px 16px;font-size:20px">${l} <b style="color:#b83a1e">−${w}</b></span>`).join("")}</div></div>`);
    add(root, `<div class="abs" id="s5tl" style="left:994px;top:530px;font-size:22px;font-weight:900;color:#5d7377;letter-spacing:2px;text-transform:uppercase">Open reports on Kuta</div>`);
    add(root, `<div class="abs" id="s5tray" style="left:990px;top:570px;width:810px;height:300px;border-radius:36px;border:4px dashed #eadfc8"></div>`);
    drops.forEach(([s, w, e, l], i) => {
      add(root, `<div class="abs card c" id="s5d${i}" style="left:${1010 + i * 158}px;top:600px;width:142px;height:236px;border-radius:28px;text-align:center;padding-top:22px">
        <div class="emoji" style="font-size:64px">${e}</div><div style="font-size:17px;font-weight:800;color:#5d7377;margin-top:6px;height:44px;line-height:1.2;padding:0 8px">${l}</div>
        <div id="s5dw${i}" style="font-size:38px;font-weight:900;color:#ff6b4a">−${w}</div>
        <div id="s5dc${i}" style="position:absolute;inset:0;border-radius:28px;background:#22c55e;display:grid;place-items:center;font-size:84px;color:#fff;font-weight:900">✓</div></div>`);
      add(root, `<div class="abs" id="s5fl${i}" style="left:0;top:0;font-size:56px;font-weight:900"></div>`);
    });
    const conf = confetti(root, "s5cf", 50, 55, ["#22c55e", "#0e9f9a", "#ffd27a", "#5cc6bf"]);
    return (t) => {
      const lt = t - 38;
      tf("s5k", { y: (1 - A(lt, 0.3, 0.5)) * 20, op: A(lt, 0.3, 0.5) });
      animWords("s5a", n1, lt, 0.4, 0.06, 5.3);
      markIn("s5m1", lt, 1.0);
      animWords("s5b", n2, lt, 5.6, 0.06);
      markIn("s5m2", lt, 6.3);
      { const k = A(lt, 0.2, 0.8, E.out5); tf("s5card", { y: (1 - k) * 80, op: k }); tf("s5ringsvg", { s: L(0.7, 1, k), op: k }); }
      { const k = A(lt, 0.8, 0.7, E.out5); tf("s5f", { x: (1 - k) * 80, op: k }); }
      op("s5tl", A(lt, 1.2, 0.4)); op("s5tray", A(lt, 1.2, 0.4));
      // health
      let hp = 100, shown = 100;
      drops.forEach(([, w], i) => {
        const inK = A(lt, dropT[i] + 0.25, 0.35), outK = A(lt, cleanT[i] + 0.2, 0.35);
        hp -= w * inK; hp += w * outK;
      });
      shown = Math.round(hp);
      const [col, ink, soft] = healthCol(shown);
      $("s5ring").setAttribute("stroke-dasharray", `${hp.toFixed(2)} 100`);
      $("s5ring").setAttribute("stroke", col);
      txt("s5num", String(shown)); $("s5num").style.color = ink;
      const lastHit = Math.max(...dropT.map((d) => (lt > d + 0.25 ? d + 0.25 : -9)), ...cleanT.map((d) => (lt > d + 0.2 ? d + 0.2 : -9)));
      const shake = lt - lastHit < 0.4 ? Math.sin((lt - lastHit) * 60) * (1 - (lt - lastHit) / 0.4) * 10 : 0;
      tf("s5num", { x: shake, s: 1 + (lt - lastHit < 0.4 ? 0.06 * (1 - (lt - lastHit) / 0.4) : 0) + (lt > 8.6 ? 0.08 * A(lt, 8.6, 0.3) * (1 - A(lt, 8.9, 0.6)) : 0) });
      const st = $("s5st");
      const label = shown >= 80 ? "Looking great" : shown >= 50 ? "Getting messy" : "Needs help";
      if (st.textContent !== label) st.textContent = label;
      st.style.background = soft; st.style.color = ink;
      st.style.left = 500 - st.offsetWidth / 2 + "px";
      tf(st, { op: A(lt, 0.8, 0.4) });
      drops.forEach((d, i) => {
        const k = A(lt, dropT[i], 0.6, E.elastic);
        const c = A(lt, cleanT[i], 0.25, E.out), fly = A(lt, cleanT[i] + 0.3, 0.5, E.in);
        tf(`s5d${i}`, { y: (1 - k) * -700 - fly * 120, r: (1 - k) * (i % 2 ? 20 : -20), s: 1 + 0.12 * Math.sin(c * Math.PI) - fly * 0.4, op: P(lt, dropT[i], dropT[i] + 0.05) * (1 - fly) });
        op(`s5dc${i}`, c);
        // floater: "−w" flying to the ring, then "+w" when cleaned
        const fl = $(`s5fl${i}`);
        const a = P(lt, dropT[i] + 0.25, dropT[i] + 0.95), b = P(lt, cleanT[i] + 0.2, cleanT[i] + 0.9);
        if (a > 0 && a < 1) { txt(`s5fl${i}`, "−" + d[1]); fl.style.color = "#ff6b4a"; tf(fl, { x: 760 + 40 * Math.sin(i), y: 420 - E.out(a) * 90, op: 1 - a, s: 1 + 0.3 * (1 - a) }); }
        else if (b > 0 && b < 1) { txt(`s5fl${i}`, "+" + d[1]); fl.style.color = "#22c55e"; tf(fl, { x: 760 + 40 * Math.sin(i), y: 420 - E.out(b) * 90, op: 1 - b, s: 1 + 0.3 * (1 - b) }); }
        else op(fl, 0);
      });
      conf(lt, 8.6, 500, 560, 0.8);
    };
  });

  // S6 — League ---------------------------------------------------------------------
  const teams = [
    { n: "Sanur", k: "Denpasar", h: [95], o: [1] },
    { n: "Canggu", k: "Badung", h: [90], o: [1] },
    { n: "Seminyak", k: "Badung", h: [80], o: [2] },
    { n: "Jimbaran", k: "Badung", h: [70], o: [3] },
    { n: "Kuta", k: "Badung", h: [55, 75, 85, 100], o: [4, 3, 2, 0], me: true },
    { n: "Padangbai", k: "Karangasem", h: [45], o: [4] },
  ];
  const kutaT = [1.7, 3.0, 4.3]; // local times when Kuta improves
  scene("s6", 48, 58, {}, (root) => {
    root.style.background = "#fbf6ec";
    add(root, `<div class="abs kicker" id="s6k" style="left:120px;top:210px">Step 3 · Climb</div>`);
    const h = "Beaches compete in a <span class='mark' id='s6m'>weekly league.</span>";
    const nh = textBlock(root, "s6a", h, "left:116px;top:250px;width:600px", "h2");
    const ld = "Ranked by health. The beach with the fewest open reports <b style='color:#12343b'>wins the week.</b>";
    const nl = textBlock(root, "s6l", ld, "left:120px;top:500px;width:600px", "lead");
    add(root, `<div class="abs card" id="s6foot" style="left:120px;top:770px;width:620px;padding:24px 28px;border-radius:28px;display:flex;gap:18px;align-items:center;background:#fef3c7;box-shadow:none">
      <span class="emoji" style="font-size:52px">🙈</span><div style="font-size:22px;font-weight:700;color:#92400e;line-height:1.35">No reports in the last 7 days? The beach shows <b>“No data yet”</b>, so hiding trash never wins.</div></div>`);
    add(root, `<div class="abs" id="s6head" style="left:830px;top:130px;width:980px;display:flex;justify-content:space-between;align-items:end"><div style="font-size:44px;font-weight:900"><span class="emoji">🏆</span> League</div><div style="font-size:20px;font-weight:800;color:#5d7377">This week · updates live</div></div>`);
    teams.forEach((b, i) => {
      add(root, `<div class="row" id="s6r${i}" style="left:830px;top:0;${b.me ? "box-shadow:0 0 0 5px #0e9f9a,0 24px 50px -16px rgba(14,159,154,.6);z-index:5" : ""}">
        <div class="rank" id="s6rk${i}">${i + 1}</div>
        <div style="width:260px"><div style="font-size:32px;font-weight:900;line-height:1.1">${b.n}${b.me ? ` <span class="pill" style="font-size:15px;background:#e6f5f4;color:#0b6b68;padding:3px 10px;vertical-align:middle">Your beach</span>` : ""}</div><div style="font-size:17px;font-weight:700;color:#5d7377">${b.k}</div></div>
        <div style="flex:1"><div class="bar"><div id="s6bar${i}"></div></div></div>
        <div id="s6h${i}" style="width:70px;text-align:right;font-size:34px;font-weight:900"></div>
        <div id="s6o${i}" class="pill" style="width:116px;justify-content:center;height:40px;font-size:17px"></div></div>`);
    });
    add(root, `<div class="abs emoji" id="s6crown" style="left:0;top:0;font-size:70px;z-index:9">👑</div>`);
    add(root, `<div class="abs pill" id="s6win" style="left:0;top:0;height:46px;padding:0 18px;font-size:19px;background:#fef3c7;color:#92400e;z-index:9;box-shadow:0 8px 20px -8px rgba(146,64,14,.5)">This week's winner</div>`);
    const conf = confetti(root, "s6cf", 60, 66);
    return (t) => {
      const lt = t - 48;
      tf("s6k", { y: (1 - A(lt, 0.3, 0.5)) * 20, op: A(lt, 0.3, 0.5) });
      animWords("s6a", nh, lt, 0.4, 0.06);
      markIn("s6m", lt, 1.0);
      animWords("s6l", nl, lt, 1.0, 0.04, 1e9, 30);
      { const k = A(lt, 6.6, 0.6, E.back); tf("s6foot", { y: (1 - k) * 40, op: k }); }
      op("s6head", A(lt, 0.3, 0.4));
      // current health per team
      const stage = (i) => { const b = teams[i]; if (!b.me) return { h: b.h[0], o: b.o[0] }; let s = 0, f = 0; for (let j = 0; j < 3; j++) { if (lt > kutaT[j]) s = j + 1; } const k = s > 0 ? A(lt, kutaT[s - 1], 0.6) : 1; const prev = Math.max(0, s - 1); return { h: s === 0 ? b.h[0] : L(b.h[prev], b.h[s], k), o: b.o[s], hs: b.h[s] }; };
      const cur = teams.map((_, i) => stage(i));
      // rank uses the settled health of each stage
      const order = teams.map((b, i) => ({ i, h: b.me ? (cur[i].hs ?? b.h[0]) : b.h[0] })).sort((a, b) => b.h - a.h || (teams[a.i].me ? -1 : 1));
      const rankOf = {}; order.forEach((o, r) => (rankOf[o.i] = r));
      // previous rank for smooth motion
      const prevOrder = (lt2) => { const hs = teams.map((b, i) => { if (!b.me) return b.h[0]; let s = 0; for (let j = 0; j < 3; j++) if (lt2 > kutaT[j]) s = j + 1; return b.h[s]; }); return teams.map((_, i) => i).sort((a, b) => hs[b] - hs[a] || (teams[a].me ? -1 : 1)); };
      teams.forEach((b, i) => {
        // find the last change time and interpolate position
        let y = rankOf[i];
        const lastT = kutaT.filter((x) => lt > x).pop();
        if (lastT !== undefined) {
          const before = prevOrder(lastT - 0.01).indexOf(i);
          y = L(before, rankOf[i], A(lt, lastT + 0.15, 0.6, E.back));
        }
        const inK = A(lt, 0.5 + i * 0.1, 0.6, E.out5);
        tf(`s6r${i}`, { x: (1 - inK) * 200, y: 250 + y * 122, op: inK, s: b.me && lastT !== undefined ? 1 + 0.04 * Math.sin(A(lt, lastT, 0.6) * Math.PI) : 1 });
        const { h, o } = cur[i];
        const [col, ink, soft] = healthCol(h);
        const grow = A(lt, 0.8 + i * 0.1, 0.8);
        const bar = $(`s6bar${i}`); bar.style.width = (h * grow).toFixed(1) + "%"; bar.style.background = col;
        txt(`s6h${i}`, String(Math.round(h * grow))); $(`s6h${i}`).style.color = ink;
        const ob = $(`s6o${i}`); txt(`s6o${i}`, o === 0 ? "0 open ✓" : `${o} open`); ob.style.background = o === 0 ? "#dcfce7" : "#ffe7e1"; ob.style.color = o === 0 ? "#15803d" : "#b83a1e";
        const rk = $(`s6rk${i}`); txt(`s6rk${i}`, String(Math.round(y) + 1));
        rk.style.background = Math.round(y) === 0 ? "#ffd27a" : "#f3ecdd";
      });
      // crown on Kuta
      const ky = 250;
      const ck = A(lt, 5.2, 0.7, E.elastic);
      tf("s6crown", { x: 830 + 22, y: ky - 44 - (1 - ck) * 300, r: -18 + (1 - ck) * 40, op: P(lt, 5.2, 5.3) });
      const wk = A(lt, 5.6, 0.5, E.back2);
      tf("s6win", { x: 830 + 980 - 236, y: ky - 26, s: L(0.5, 1, wk), op: wk });
      conf(lt, 5.4, 830 + 200, ky + 40, 0.9);
    };
  });

  // S7 — Badges & weekly challenge ----------------------------------------------------
  const BADGES = [["📍", "First report", "Report your first spot"], ["🧹", "First clean", "Clean your first spot"], ["🔟", "Ten cleans", "Clean 10 spots"], ["🔥", "Hotspot hunter", "Clean a hotspot"], ["💪", "Big haul", "Clean a large pile"], ["🏝️", "Three beaches", "Report on 3 beaches"]];
  scene("s7", 58, 68, { pre: 0.45, iris: [960, 540] }, (root) => {
    root.style.background = "radial-gradient(circle at 50% 30%,#14b3ad 0,#0e9f9a 40%,#0b6b68 100%)";
    let rays = "";
    for (let i = 0; i < 24; i++) rays += `<path d="M960 420L${960 + 1600 * Math.cos((i / 24) * 2 * Math.PI)} ${420 + 1600 * Math.sin((i / 24) * 2 * Math.PI)}L${960 + 1600 * Math.cos(((i + 0.45) / 24) * 2 * Math.PI)} ${420 + 1600 * Math.sin(((i + 0.45) / 24) * 2 * Math.PI)}Z" fill="#fff" opacity=".045"/>`;
    add(root, `<svg class="abs" id="s7rays" style="left:0;top:0;transform-origin:960px 420px" width="${W}" height="${H}">${rays}</svg>`);
    add(root, `<div class="abs kicker" id="s7k" style="left:0;width:${W}px;text-align:center;top:84px;color:#bff3ef">Bonus</div>`);
    const h = "Earn points <span style='color:#ffd27a'>&amp; badges</span> as you play.";
    const nh = textBlock(root, "s7a", h, `left:0;width:${W}px;top:124px;text-align:center;color:#fff`, "h2");
    BADGES.forEach(([e, n, how], i) => add(root, `<div class="badge" id="s7b${i}" style="left:${195 + i * 260}px;top:250px;color:#fff"><div class="medal emoji">${e}</div><b>${n}</b><span style="color:#bff3ef">${how}</span></div>`));
    add(root, `<div class="abs card" id="s7ch" style="left:300px;top:610px;width:1320px;height:330px;padding:34px 44px;border-radius:44px">
      <div style="display:flex;align-items:center;gap:22px"><div class="emoji" style="font-size:70px">🧹</div><div><div style="font-size:20px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#0e9f9a">Weekly challenge · everyone together</div><div style="font-size:50px;font-weight:900;letter-spacing:-1px">Clean 50 spots this week</div></div>
      <div style="margin-left:auto;text-align:right"><div style="font-size:64px;font-weight:900;line-height:1"><span id="s7n" style="color:#0e9f9a">0</span><span style="color:#5d7377;font-size:36px"> / 50</span></div></div></div>
      <div style="margin-top:28px;height:36px;border-radius:99px;background:#e6f5f4;overflow:hidden;position:relative"><div id="s7bar" style="height:100%;border-radius:99px;background:linear-gradient(90deg,#0e9f9a,#22c55e)"></div></div>
      <div style="margin-top:18px;display:flex;justify-content:space-between;font-size:20px;font-weight:800;color:#5d7377"><span id="s7msg">Every clean by every player counts.</span><span>Resets Monday 00:00 WITA</span></div></div>`);
    const av = ["🐢", "🦀", "🐠", "🐬", "🌺", "🦜", "🐙", "🥥", "🐚", "🏄"];
    av.forEach((e, i) => add(root, `<div class="abs emoji" id="s7av${i}" style="left:0;top:0;width:58px;height:58px;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:32px;box-shadow:0 6px 14px rgba(0,0,0,.18)">${e}</div>`));
    add(root, `<div class="abs pill" id="s7top" style="left:0;width:${W}px;justify-content:center;top:958px;font-size:22px;color:#bff3ef">Players tab: the top 20 by points</div>`);
    const conf = confetti(root, "s7cf", 70, 77);
    return (t) => {
      const lt = t - 58;
      tf("s7rays", { r: lt * 4, op: 1 });
      tf("s7k", { y: (1 - A(lt, 0.2, 0.5)) * 20, op: A(lt, 0.2, 0.5) });
      animWords("s7a", nh, lt, 0.3, 0.06);
      BADGES.forEach((_, i) => {
        const k = A(lt, 1.0 + i * 0.25, 0.8, E.back2);
        tf(`s7b${i}`, { ry: (1 - k) * 90, y: (1 - k) * 40 + 6 * Math.sin(lt * 2 + i), s: L(0.6, 1, k), op: P(lt, 1.0 + i * 0.25, 1.15 + i * 0.25) });
      });
      { const k = A(lt, 3.6, 0.7, E.out5); tf("s7ch", { y: (1 - k) * 120, op: k }); }
      const prog = A(lt, 4.5, 2.6, E.io);
      const n = Math.round(prog * 50);
      txt("s7n", String(n));
      $("s7bar").style.width = (prog * 100).toFixed(2) + "%";
      txt("s7msg", n >= 50 ? "Goal reached. Great work, everyone!" : "Every clean by every player counts.");
      $("s7msg").style.color = n >= 50 ? "#15803d" : "#5d7377";
      av.forEach((_, i) => {
        const at = (i + 1) / 11, tt = 4.5 + 2.6 * invIo(at), k = P(lt, tt, tt + 1.0);
        const x = 344 + 1232 * at - 29, y = 776 - E.out(k) * 34;
        tf(`s7av${i}`, { x, y, s: E.back(Math.min(1, k * 3)) * (1 - 0.3 * P(k, 0.6, 1)), op: k > 0 && k < 1 ? 1 - P(k, 0.6, 1) : 0 });
      });
      tf("s7n", { s: 1 + (n >= 50 ? 0.25 * A(lt, 7.1, 0.2) * (1 - A(lt, 7.3, 0.5)) : 0) });
      op("s7top", A(lt, 7.8, 0.5));
      conf(lt, 7.15, 1450, 680, 1.0);
    };
  });

  // S8 — Outro -------------------------------------------------------------------------
  scene("s8", 68, 76, {}, (root) => {
    const sea = seaScene(root, "s8");
    const C = [960, 400], R = 210;
    add(root, `<svg class="abs" id="s8loop" style="left:0;top:0;transform-origin:960px 400px" width="${W}" height="${H}">
      <circle cx="${C[0]}" cy="${C[1]}" r="${R}" fill="none" stroke="#0e9f9a" stroke-width="8" stroke-dasharray="18 22" id="s8dash" stroke-linecap="round"/></svg>`);
    const items = [["📸", "Report"], ["🧹", "Clean"], ["📈", "Climb"]];
    items.forEach(([e, l], i) => add(root, `<div class="abs" id="s8i${i}" style="left:-90px;top:-90px;width:180px;text-align:center"><div class="emoji" style="width:180px;height:180px;border-radius:50%;background:#fff;display:grid;place-items:center;font-size:84px;box-shadow:0 20px 40px -14px rgba(11,107,104,.45)">${e}</div><div style="margin-top:10px;font-size:34px;font-weight:900">${l}</div></div>`));
    add(root, `<div class="abs c" id="s8mark" style="left:880px;top:150px;width:160px;height:160px;filter:drop-shadow(0 24px 40px rgba(11,107,104,.35))">${markSVG("s8m")}</div>`);
    add(root, `<div class="abs" id="s8wm" style="left:0;width:${W}px;top:330px;text-align:center;font-weight:900;font-size:150px;letter-spacing:-5px;line-height:1"><span style="color:#12343b">Hai</span> <span style="color:#0b6b68">Pantai</span></div>`);
    add(root, `<div class="abs" id="s8tag" style="left:0;width:${W}px;top:510px;text-align:center;font-size:56px;font-weight:900;color:#0e9f9a">Grab a bag. Hit the beach.</div>`);
    add(root, `<div class="abs pill" id="s8pill" style="left:0;top:615px;height:58px;padding:0 28px;background:#fff;font-size:24px;color:#3d5a60;box-shadow:0 10px 30px -10px rgba(18,52,59,.35)">No sign-up. Just a nickname and an emoji buddy <span class="emoji">🐢</span></div>`);
    add(root, `<div class="abs" id="s8fade" style="inset:0;background:#fbf6ec"></div>`);
    const conf = confetti(root, "s8cf", 70, 88);
    return (t) => {
      const lt = t - 68;
      sea(t, 1);
      const out = A(lt, 2.9, 0.7, E.in);
      $("s8dash").setAttribute("stroke-dashoffset", (-lt * 80).toFixed(1));
      tf("s8loop", { s: L(0.6, 1, A(lt, 0.2, 0.7, E.out5)) * (1 - out), r: lt * 10 + out * 120, op: A(lt, 0.2, 0.4) * (1 - out) });
      items.forEach((_, i) => {
        const k = A(lt, 0.3 + i * 0.3, 0.6, E.back2);
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3 + lt * 0.35 + out * 2.5;
        const r = R * (1 - out);
        tf(`s8i${i}`, { x: C[0] + r * Math.cos(a), y: C[1] + r * Math.sin(a) - 20, s: k * (1 - out), op: k * (1 - out) });
      });
      const mk = A(lt, 3.4, 0.8, E.back2);
      tf("s8mark", { s: mk, r: (1 - mk) * -30, y: 5 * Math.sin(lt * 2), op: P(lt, 3.4, 3.5) });
      markRender("s8m", t);
      const wk = A(lt, 3.8, 0.7, E.out5);
      tf("s8wm", { y: (1 - wk) * 60, s: L(0.9, 1, wk), op: wk });
      const gk = A(lt, 4.3, 0.6, E.back);
      tf("s8tag", { y: (1 - gk) * 40, op: gk });
      const pk = A(lt, 4.8, 0.6, E.back);
      const pill = $("s8pill"); pill.style.left = 960 - pill.offsetWidth / 2 + "px";
      tf(pill, { y: (1 - pk) * 30, s: L(0.8, 1, pk), op: pk });
      conf(lt, 3.6, 960, 260, 1.1);
      op("s8fade", A(lt, 7.4, 0.6, E.io));
    };
  });

  // ---------- transitions ----------
  const tx = add(stage, `<svg class="abs" id="tx" style="left:0;top:0;z-index:100" width="${W}" height="${H}"><path id="txa"/><path id="txb"/></svg>`);
  const TX = [
    { at: 6, type: "rise", c: ["#2fb3ac", "#0e9f9a"] },
    { at: 26, type: "sweep", c: ["#0b6b68", "#0e9f9a"] },
    { at: 38, type: "sweep", c: ["#ff6b4a", "#ffd27a"], rev: true },
    { at: 48, type: "sweep", c: ["#0b6b68", "#0e9f9a"] },
    { at: 68, type: "rise", c: ["#6ccbc4", "#2fb3ac"] },
  ];
  function renderTx(t) {
    const ta = $("txa"), tb = $("txb");
    ta.setAttribute("d", ""); tb.setAttribute("d", "");
    for (const x of TX) {
      const d = 1.0, k = (t - (x.at - d / 2)) / d;
      if (k <= 0 || k >= 1) continue;
      const lay = (path, col, k0, k1, k2, k3) => {
        const len = x.type === "rise" ? H : W, amp = 34;
        const f = L(-amp * 2, len + amp * 2, E.io(P(k, k0, k1))), b = L(-amp * 2, len + amp * 2, E.io(P(k, k2, k3)));
        let a1 = b, a2 = f;
        if (x.type === "rise") { a1 = H - f; a2 = H - b; }
        else if (x.rev) { a1 = W - f; a2 = W - b; }
        path.setAttribute("d", bandPath(a1, a2, amp, t * 6, x.type === "rise"));
        path.setAttribute("fill", col);
      };
      lay(ta, x.c[0], 0, 0.45, 0.55, 1);
      lay(tb, x.c[1], 0.06, 0.5, 0.5, 0.94);
    }
  }

  // ---------- frame ----------
  window.DURATION = DUR;
  window.renderFrame = (t) => {
    scenes.forEach((s, i) => {
      const next = scenes[i + 1];
      const post = next ? next.pre : 0;
      const vis = t >= s.start - s.pre && t < s.end + post;
      s.root.style.display = vis ? "block" : "none";
      if (!vis) return;
      if (s.iris) {
        const k = A(t, s.start - s.pre, s.pre * 2, E.io);
        s.root.style.clipPath = k >= 1 ? "none" : `circle(${(k * 2300).toFixed(1)}px at ${s.iris[0]}px ${s.iris[1]}px)`;
      }
      s.render(t);
    });
    renderTracker(t);
    renderTx(t);
  };
  window.renderFrame(0);
  window.ready = document.fonts.ready.then(() => true);
})();
