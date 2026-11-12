// Synthesizes the soundtrack for the one-hour film, in sync with src/timeline.js.
// 120 BPM. Hook: a dark pulse and a ticking clock. Product: tropical house in D major (the
// launch film's sound). Rewind: tape stop. Build: a driving D minor arpeggio that adds a layer
// every scene. Finale: the major chord comes back. Output: out/soundtrack.wav, 48 kHz stereo.
// No samples, no stock audio.
import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const TL = createRequire(import.meta.url)("./src/timeline.js");
const SR = 48000, DUR = TL.DURATION, N = Math.ceil(DUR * SR);
const { BEAT, BAR, S } = TL;
const L = new Float32Array(N), R = new Float32Array(N);
const RL = new Float32Array(N), RR = new Float32Array(N);
const duck = new Float32Array(N).fill(1);
const TAU = Math.PI * 2;
let seed = 3;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function add(t0, dur, fn, { gain = 1, pan = 0, send = 0, ducked = false } = {}) {
  const s0 = Math.max(0, Math.floor(t0 * SR)), s1 = Math.min(N, Math.floor((t0 + dur) * SR));
  const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let s = s0; s < s1; s++) {
    const t = (s - s0) / SR;
    let v = fn(t, s / SR);
    if (ducked) v *= duck[s];
    L[s] += v * gl; R[s] += v * gr;
    if (send) { RL[s] += v * gl * send; RR[s] += v * gr * send; }
  }
}
const lp = (k) => { let y = 0; return (x) => (y += k * (x - y)); };
const hpf = (k) => { let y = 0; return (x) => x - (y += k * (x - y)); };
const saw = (f, u) => 2 * ((f * u) % 1) - 1;

// ---------- sections ----------
const PROD = [S.product, S.rewind], BUILD = [S.master, S.finale - 0.25], FIN = S.finale;
const inR = (t, [a, b]) => t >= a && t < b;
const MAJ = [[50, 54, 57, 62], [45, 52, 57, 61], [47, 54, 59, 62], [43, 50, 55, 59]]; // D A Bm G
const MAJR = [38, 33, 35, 31];
const MIN = [[50, 53, 57, 62], [46, 50, 53, 58], [45, 48, 53, 57], [48, 52, 55, 60]]; // Dm Bb F C
const MINR = [38, 34, 41, 36];
const level = (t) => (t < S.swarm ? 0 : t < S.agents ? 1 : t < S.humans ? 2 : t < S.github ? 3 : 4); // build intensity

function kick(t, g = 1) {
  add(t, 0.5, (u) => Math.sin(TAU * (45 * u + (95 / 28) * (1 - Math.exp(-u * 28)))) * Math.exp(-u * 6.5), { gain: 0.62 * g });
  const s0 = Math.floor(t * SR);
  for (let i = 0; i < 0.3 * SR && s0 + i < N; i++) duck[s0 + i] = Math.min(duck[s0 + i], 0.42 + 0.58 * Math.min(1, i / (0.3 * SR)) ** 1.6);
}
const clap = (t, g = 1) => { const b = hpf(0.25), l2 = lp(0.35); add(t, 0.35, (u) => l2(b(noise())) * (u < 0.03 ? Math.exp(-((u % 0.01) * 400)) : Math.exp(-(u - 0.03) * 18)), { gain: 0.22 * g, send: 0.4 }); };
const hat = (t, g = 1, open = false) => { const hp = hpf(0.6); add(t, open ? 0.25 : 0.07, (u) => hp(noise()) * Math.exp(-u * (open ? 14 : 55)), { gain: 0.055 * g, pan: 0.25 }); };

// ---------- hook: sub pulse under the words, dark pad ----------
for (let q = 0; q < 6; q++) {
  const t = q * BEAT + 0.1;
  add(t, 0.6, (u) => Math.sin(TAU * 41 * u) * Math.exp(-u * 5) * Math.min(1, u / 0.005), { gain: 0.5 });
}
[50, 53, 57, 62].forEach((m, j) => { const f = mtof(m), f1 = lp(0.02), f2 = lp(0.02); add(0, 3.0, (u) => f2(f1(saw(f, u) + saw(f * 1.004, u))) * Math.min(1, u / 0.8) * (u > 2.7 ? (3 - u) / 0.3 : 1), { gain: 0.05, pan: (j - 1.5) * 0.4, send: 0.6 }); });

// ---------- product: tropical house in D major ----------
for (let b = 0; b < 3; b++) {
  const t0 = S.product + b * BAR, ch = MAJ[b % 4];
  ch.forEach((m, j) => {
    const f = mtof(m + 12), f1 = lp(0.06), f2 = lp(0.06);
    add(t0, BAR + 0.2, (u) => { let v = 0; for (const d of [-0.11, 0, 0.13]) v += saw(f * (1 + d / 100 * 6), u); return f2(f1(v)) * Math.min(1, u / 0.2) * (u > BAR ? Math.max(0, 1 - (u - BAR) / 0.2) : 1); },
      { gain: 0.05, pan: (j - 1.5) * 0.35, send: 0.5, ducked: true });
  });
  for (let q = 0; q < 4; q++) { const t = t0 + q * BEAT; kick(t); if (q % 2) clap(t); }
  for (let x = 0; x < 16; x++) hat(t0 + x * BEAT / 4, x % 4 === 2 ? 1 : x % 2 ? 0.45 : 0.6);
  const BASS = [1, 0, 0, 1, 1, 0, 1, 0], ARP = [0, 1, 2, 3, 2, 1, 2, 3];
  for (let e = 0; e < 8; e++) {
    const t = t0 + e * BEAT / 2;
    if (BASS[e]) { const f = mtof(MAJR[b % 4] + (e === 6 ? 7 : 0)); add(t, 0.3, (u) => Math.tanh((Math.sin(TAU * f * u) + 0.3 * Math.sin(TAU * 2 * f * u)) * 1.4) * Math.exp(-u * 7) * Math.min(1, u / 0.004), { gain: 0.26, ducked: true }); }
    const f = mtof(ch[ARP[e]] + 24), f1 = lp(0.5);
    add(t, 0.6, (u) => f1(Math.sin(TAU * f * u) + 0.35 * Math.sin(TAU * 4 * f * u) * Math.exp(-u * 30)) * Math.exp(-u * 7.5), { gain: 0.075, pan: e % 2 ? 0.35 : -0.35, send: 0.35 });
  }
}

// ---------- rewind: a low drone with a tremble ----------
add(S.rewind + 0.3, 1.2, (u) => (Math.sin(TAU * 73 * u) + 0.5 * Math.sin(TAU * 110 * u)) * Math.sin(Math.PI * u / 1.2) * (0.7 + 0.3 * Math.sin(TAU * 11 * u)), { gain: 0.08, send: 0.6 });

// ---------- build: D minor drive ----------
const bBars = Math.ceil((BUILD[1] - BUILD[0]) / BAR);
for (let b = 0; b < bBars; b++) {
  const t0 = BUILD[0] + b * BAR, ch = MIN[b % 4], root = MINR[b % 4];
  // pad
  ch.forEach((m, j) => {
    const f = mtof(m + 12), lv = level(t0), f1 = lp(0.02 + lv * 0.012), f2 = lp(0.02 + lv * 0.012);
    add(t0, BAR + 0.15, (u, at) => { if (at >= BUILD[1]) return 0; let v = 0; for (const d of [-0.12, 0, 0.14]) v += saw(f * (1 + d / 100 * 6), u); return f2(f1(v)) * Math.min(1, u / 0.25) * (u > BAR ? Math.max(0, 1 - (u - BAR) / 0.15) : 1); },
      { gain: 0.045, pan: (j - 1.5) * 0.4, send: 0.5, ducked: true });
  });
  for (let x = 0; x < 16; x++) {
    const t = t0 + x * BEAT / 4;
    if (t >= BUILD[1]) break;
    const lv = level(t);
    // the arp: 16th-note saw plucks, brighter every scene
    const ARP16 = [0, 2, 3, 1, 2, 3, 0, 3, 1, 2, 3, 2, 0, 3, 2, 1];
    const m = ch[ARP16[x]] + 12 + (lv >= 3 && x % 4 === 3 ? 12 : 0);
    const f = mtof(m), fl = lp(0.07 + lv * 0.05);
    add(t, 0.22, (u) => fl(saw(f, u) + 0.5 * saw(f * 2.005, u)) * Math.exp(-u * 16), { gain: 0.07, pan: x % 2 ? 0.3 : -0.3, send: 0.3, ducked: lv >= 1 });
    // pulse bass on eighths
    if (x % 2 === 0) { const fb = mtof(root + (x === 12 ? 12 : 0)); add(t, 0.22, (u) => Math.tanh((Math.sin(TAU * fb * u) + 0.4 * saw(fb, u)) * 1.6) * Math.exp(-u * 10) * Math.min(1, u / 0.003), { gain: lv >= 2 ? 0.24 : 0.14, ducked: true }); }
    if (lv >= 1 && x % 4 === 0) kick(t, 0.95);
    if (lv >= 1) hat(t, (x % 4 === 2 ? 1 : x % 2 ? 0.4 : 0.6) * (lv >= 3 ? 1.1 : 0.8));
    if (lv >= 2 && x % 8 === 4) clap(t, 1);
    if (lv >= 3 && x % 4 === 2) hat(t, 0.9, true);
  }
}
// snare roll into the finale
for (let i = 0; i < 16; i++) { const t = S.github + 1.25 + 1.5 * (1 - Math.pow(1 - i / 16, 1.6)); if (t < BUILD[1]) clap(t, 0.25 + i * 0.04); }

// ---------- finale: D major blooms, bell melody ----------
[38, 50, 54, 57, 62, 66, 69, 74].forEach((m, j) => {
  const f = mtof(m + 12), f1 = lp(0.08);
  add(FIN, DUR - FIN, (u) => { let v = 0; for (const d of [-0.1, 0, 0.12]) v += saw(f * (1 + d / 100 * 6), u); return f1(v) * Math.min(1, u / 0.04) * (0.55 + 0.45 * Math.exp(-u * 1.2)); }, { gain: j === 0 ? 0.09 : 0.045, pan: (j - 3.5) * 0.2, send: 0.8 });
});
add(FIN, 2.5, (u) => Math.sin(TAU * mtof(26) * u) * Math.exp(-u * 1.5), { gain: 0.35 });
[[0.55, 81], [0.8, 78], [1.05, 74], [1.3, 76], [1.55, 78], [1.8, 81], [2.05, 86]].forEach(([d, m]) => {
  const f = mtof(m); add(FIN + d, 2, (u) => Math.sin(TAU * f * u + 1.1 * Math.sin(TAU * f * 3.5 * u) * Math.exp(-u * 3)) * Math.exp(-u * 2), { gain: 0.06, pan: 0.2, send: 0.9 });
});

// Ocean bed at the open and the close
{
  const l1 = lp(0.02), lv = lp(0.0001); let br = 0;
  add(0, DUR, (u, t) => { br = br * 0.995 + noise() * 0.06; const sw = 0.4 + 0.6 * Math.pow(0.5 + 0.5 * Math.sin(TAU * t / 5 - 1.5), 2); const g = t < S.product ? 0.6 : t < FIN ? 0.0 : 0.5; return l1(br) * sw * lv(g); }, { gain: 0.9 });
}

// ---------- sound effects ----------
const FX = {
  whoosh: (t, g, soft) => { const f = lp(0.02), f2 = lp(0.2); add(t - 0.35, 0.8, (u) => { const k = u / 0.8; const c = 0.01 + 0.25 * Math.sin(Math.PI * k) ** 2; return f2(f(noise())) * Math.sin(Math.PI * k) ** 2 * (1 + 8 * c); }, { gain: (soft ? 0.25 : 0.45) * g, send: 0.3 }); },
  thud: (t, g) => add(t, 0.45, (u) => Math.sin(TAU * (55 * u + 3 * (1 - Math.exp(-u * 20)))) * Math.exp(-u * 8) + noise() * Math.exp(-u * 120) * 0.35, { gain: 0.55 * g, send: 0.2 }),
  pop: (t, g) => { const p = rnd() * 0.6 - 0.3, f0 = 700 + rnd() * 500; add(t, 0.12, (u) => Math.sin(TAU * (f0 * u - 2600 * u * u)) * Math.exp(-u * 40), { gain: 0.3 * g, pan: p, send: 0.25 }); },
  pip: (t, g) => { const f0 = 1400 + rnd() * 900, p = rnd() * 1.2 - 0.6; add(t, 0.07, (u) => Math.sin(TAU * f0 * u) * Math.exp(-u * 70), { gain: 0.12 * g, pan: p, send: 0.4 }); },
  shimmer: (t, g) => { for (let i = 0; i < 14; i++) { const f = mtof([74, 76, 78, 81, 83, 86, 88, 90][i % 8] + (i > 7 ? 12 : 0)), d = i * 0.07; add(t + d, 2.0, (u) => Math.sin(TAU * f * u) * Math.min(1, u / 0.05) * Math.exp(-u * 2.2), { gain: 0.04 * g, pan: (i % 5) / 2.5 - 0.8, send: 0.9 }); } },
  riser: (t, g, dur) => { const hh = hpf(0.05), l = lp(0.3); add(t, dur, (u) => { const k = u / dur; return (l(hh(noise())) * 0.8 + 0.25 * Math.sin(TAU * (200 * u + 700 * u * u / dur))) * k * k; }, { gain: 0.35 * g, send: 0.5 }); },
  impact: (t, g) => { add(t, 1.6, (u) => Math.sin(TAU * (38 * u + 8 * (1 - Math.exp(-u * 10)))) * Math.exp(-u * 3) * 1.1, { gain: 0.55 * g }); const hh = hpf(0.3); add(t, 2.0, (u) => hh(noise()) * Math.exp(-u * 2.4) * 0.5, { gain: 0.32 * g, send: 0.8 }); },
  sparkle: (t, g) => [86, 88, 90, 93, 95, 98].forEach((m, i) => { const f = mtof(m); add(t + i * 0.045, 0.6, (u) => Math.sin(TAU * f * u) * Math.exp(-u * 8), { gain: 0.05 * g, pan: i / 3 - 0.8, send: 0.8 }); }),
  tap: (t, g) => add(t, 0.05, (u) => (Math.sin(TAU * 1700 * u) * 0.6 + noise() * 0.4) * Math.exp(-u * 160), { gain: 0.35 * g }),
  tick: (t, g) => add(t, 0.06, (u) => (Math.sin(TAU * 2400 * u) * 0.7 + noise() * 0.3) * Math.exp(-u * 110), { gain: 0.32 * g, pan: 0.1, send: 0.2 }),
  ding: (t, g) => [[86, 1], [93, 0.5], [98, 0.25]].forEach(([m, a]) => { const f = mtof(m); add(t, 1.6, (u) => Math.sin(TAU * f * u + 0.6 * Math.sin(TAU * f * 2 * u) * Math.exp(-u * 6)) * Math.exp(-u * 2.8) * a, { gain: 0.1 * g, send: 0.7 }); }),
  scan: (t, g) => add(t, 1.2, (u) => Math.sin(TAU * (380 * u + 450 * u * u)) * (0.5 + 0.5 * Math.sin(TAU * 18 * u)) * Math.sin(Math.PI * u / 1.2), { gain: 0.05 * g, send: 0.5, pan: rnd() - 0.5 }),
  blip: (t, g) => add(t, 0.09, (u) => Math.sign(Math.sin(TAU * (1200 + 2000 * u) * u)) * 0.4 * Math.exp(-u * 45), { gain: 0.11 * g, pan: rnd() * 0.6 - 0.3, send: 0.3 }),
  type: (t, g) => { for (let i = 0; i < 14; i++) add(t + i * 0.04 + rnd() * 0.01, 0.02, (u) => noise() * Math.exp(-u * 400), { gain: 0.18 * g, pan: rnd() * 0.4 - 0.2 }); },
  drop: (t, g) => add(t - 0.12, 0.28, (u) => Math.sin(TAU * (1300 * u - 1500 * u * u)) * Math.exp(-u * 10) * 0.6, { gain: 0.22 * g, send: 0.4 }),
  snap: (t, g) => add(t, 0.12, (u) => Math.sin(TAU * (500 * u + 2500 * u * u)) * Math.exp(-u * 35), { gain: 0.3 * g, send: 0.3 }),
  swipe: (t, g) => { const f = lp(0.08); add(t, 0.9, (u) => f(noise()) * Math.sin(Math.PI * u / 0.9) * 3, { gain: 0.22 * g, pan: -0.3 }); },
  count: (t, g) => { for (let i = 0; i < 16; i++) { const f = 700 + i * 60; add(t + 0.5 * (1 - Math.pow(1 - i / 16, 2)), 0.05, (u) => Math.sin(TAU * f * u) * Math.exp(-u * 90), { gain: 0.14 * g, send: 0.2 }); } },
  commit: (t, g) => [[88, 0], [95, 0.05]].forEach(([m, d]) => { const f = mtof(m); add(t + d, 0.25, (u) => Math.sin(TAU * f * u) * Math.exp(-u * 18), { gain: 0.06 * g, pan: 0.3, send: 0.5 }); }),
  merge: (t, g) => [[81, 0], [86, 0.06], [93, 0.12]].forEach(([m, d]) => { const f = mtof(m); add(t + d, 0.6, (u) => Math.sin(TAU * f * u + 0.4 * Math.sin(TAU * 2 * f * u)) * Math.exp(-u * 7), { gain: 0.08 * g, pan: -0.2, send: 0.6 }); }),
  glitch: (t, g) => { for (let i = 0; i < 9; i++) { const f = 200 + rnd() * 1800, d = i * 0.03; add(t + d, 0.03, (u) => Math.sign(Math.sin(TAU * f * u)) * (rnd() > 0.5 ? 1 : -0.5), { gain: 0.08 * g, pan: rnd() - 0.5 }); } },
  tapestop: (t, g) => { // the product groove's last chord, slowing to a stop
    MAJ[2].forEach((m) => { const f0 = mtof(m + 12); let ph = 0; const fl = lp(0.05); add(t - 0.02, 0.55, (u) => { const sp = Math.pow(Math.max(0, 1 - u / 0.55), 1.5); ph += f0 * sp / SR; return fl(2 * (ph % 1) - 1) * sp; }, { gain: 0.09 * g, send: 0.3 }); });
    let ph = 0; add(t - 0.02, 0.55, (u) => { const sp = Math.max(0, 1 - u / 0.55); ph += 55 * sp / SR; return Math.sin(TAU * ph) * sp; }, { gain: 0.4 * g });
  },
  rewind: (t, g) => { // tape spinning backwards: warbling chirps, rising
    const f = lp(0.1);
    add(t, 0.85, (u) => { const k = u / 0.85; return (f(noise()) * 2 + 0.4 * Math.sin(TAU * (900 + 1400 * k) * u * (1 + 0.3 * Math.sin(TAU * 22 * u)))) * k * (u > 0.8 ? (0.85 - u) / 0.05 : 1); }, { gain: 0.16 * g, send: 0.4 });
  },
};
FX.whooshSoft = (t, g) => FX.whoosh(t, g, true);
const impacts = TL.CUES.filter((c) => c[1] === "impact").map((c) => c[0]);
for (const [t, k, g] of TL.CUES) {
  if (k === "riser") { const next = impacts.find((x) => x > t) ?? t + 1.6; FX.riser(t, g, next - t); continue; }
  if (!FX[k]) throw new Error("no sound for cue " + k);
  FX[k](t, g);
}

// ---------- reverb, mix, master ----------
function reverb(inp, off) {
  const out = new Float32Array(N);
  const combs = [1687, 1601, 2053, 2251].map((d) => ({ d: d + off, b: new Float32Array(d + off), i: 0, y: 0 }));
  const aps = [347, 113].map((d) => ({ d, b: new Float32Array(d), i: 0 }));
  for (let s = 0; s < N; s++) {
    let acc = 0;
    for (const c of combs) { const o = c.b[c.i]; c.y = o * 0.7 + c.y * 0.3; c.b[c.i] = inp[s] + c.y * 0.84; c.i = (c.i + 1) % c.d; acc += o; }
    acc *= 0.25;
    for (const a of aps) { const o = a.b[a.i]; const v = -acc * 0.5 + o; a.b[a.i] = acc + o * 0.5; a.i = (a.i + 1) % a.d; acc = v; }
    out[s] = acc;
  }
  return out;
}
const vl = reverb(RL, 0), vr = reverb(RR, 37);
let peak = 0;
for (let s = 0; s < N; s++) { L[s] += vl[s] * 0.5; R[s] += vr[s] * 0.5; peak = Math.max(peak, Math.abs(L[s]), Math.abs(R[s])); }
const pre = 1.15 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let s = 0; s < N; s++) {
  const f = Math.min(1, (N - s) / (0.6 * SR)) * Math.min(1, s / (0.02 * SR));
  buf.writeInt16LE(Math.round(Math.tanh(L[s] * pre) * 0.89 * f * 32767), 44 + s * 4);
  buf.writeInt16LE(Math.round(Math.tanh(R[s] * pre) * 0.89 * f * 32767), 46 + s * 4);
}
mkdirSync(join(here, "out"), { recursive: true });
writeFileSync(join(here, "out/soundtrack.wav"), buf);
console.log("soundtrack", DUR.toFixed(1) + "s", "peak", peak.toFixed(2));
