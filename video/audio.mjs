// Synthesizes the soundtrack: a tropical-house groove in D major at 100 BPM,
// ocean ambience, and UI sound effects on the cues in src/timeline.js.
// Output: out/soundtrack.wav (48 kHz, 16-bit stereo). No samples, no stock audio.
import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SHORT = process.argv.includes("--short");
const TL = createRequire(import.meta.url)(SHORT ? "./src/short-timeline.js" : "./src/timeline.js");
const SR = 48000, DUR = TL.DURATION + 1.0, N = Math.ceil(DUR * SR);
const { BEAT, BAR, S } = TL;
const L = new Float32Array(N), R = new Float32Array(N);       // dry
const RL = new Float32Array(N), RR = new Float32Array(N);     // reverb send
const duck = new Float32Array(N).fill(1);                     // sidechain from the kick
const TAU = Math.PI * 2;
let seed = 1;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Write a mono generator into the buses. fn(i, t) returns a sample; dur in seconds.
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
const lp = (k) => { let y = 0; return (x) => (y += k * (x - y)); };        // one-pole low pass
const hpf = (k) => { let y = 0; return (x) => x - (y += k * (x - y)); };

// ---------- arrangement ----------
const bars = Math.ceil(TL.DURATION / BAR);
const CHORDS = [[50, 54, 57, 62], [45, 52, 57, 61], [47, 54, 59, 62], [43, 50, 55, 59]]; // D A Bm G
const ROOTS = [38, 33, 35, 31];
const bp = (t) => Math.min(1, Math.max(0, (t - S.problem) / (S.logo - S.problem)));
const sec = (t) => (t < S.problem ? "cold" : t < S.logo ? "build" : t < S.tech ? "groove" : t < S.finale ? "tech" : t < S.end - 2.4 ? "finale" : "outro");

// Kick first, so the sidechain exists before other parts are rendered.
for (let b = 0; b < bars; b++) for (let q = 0; q < 4; q++) {
  const t = b * BAR + q * BEAT, s = sec(t);
  if (!(s === "groove" || s === "finale" || (s === "tech" && q % 2 === 0))) continue;
  if (t >= S.compete && t < S.compete + BAR && q > 0) continue; // a breath when the league starts
  add(t, 0.5, (u) => Math.sin(TAU * (45 * u + (95 / 28) * (1 - Math.exp(-u * 28)))) * Math.exp(-u * 6.5) * 1.0, { gain: 0.62 });
  const s0 = Math.floor(t * SR);
  for (let i = 0; i < 0.32 * SR && s0 + i < N; i++) duck[s0 + i] = Math.min(duck[s0 + i], 0.45 + 0.55 * Math.min(1, i / (0.32 * SR)) ** 1.6);
}

// Pad: detuned saws through a low pass, one chord per bar
for (let b = 0; b < bars; b++) {
  const t = b * BAR, s = sec(t);
  if (s === "outro") continue;
  const ch = CHORDS[b % 4];
  const cut = s === "cold" ? 0.018 : s === "build" ? 0.02 + 0.04 * bp(t) : s === "tech" ? 0.025 : 0.06;
  const g = s === "cold" ? 0.05 : s === "build" ? 0.06 : 0.055;
  ch.forEach((m, j) => {
    const f = mtof(m + 12);
    const f1 = lp(cut), f2 = lp(cut);
    add(t, BAR + 0.9, (u) => {
      const env = Math.min(1, u / 0.35) * (u > BAR ? Math.max(0, 1 - (u - BAR) / 0.9) : 1);
      let v = 0;
      for (const d of [-0.11, 0, 0.13]) { const ph = (f * (1 + d / 100 * 6) * u) % 1; v += 2 * ph - 1; }
      return f2(f1(v)) * env;
    }, { gain: g, pan: (j - 1.5) * 0.35, send: 0.5, ducked: s !== "cold" });
  });
}
// The last chord rings out
CHORDS[0].concat([66, 69]).forEach((m, j) => { const f = mtof(m + 12), f1 = lp(0.05); add(S.end - 2.4, 4.0, (u) => { let v = 0; for (const d of [-0.1, 0, 0.12]) { const ph = (f * (1 + d / 100 * 6) * u) % 1; v += 2 * ph - 1; } return f1(v) * Math.min(1, u / 0.05) * Math.exp(-u * 0.9); }, { gain: 0.06, pan: (j - 2.5) * 0.3, send: 0.8 }); });

// Bass
const BASS = [1, 0, 0, 1, 1, 0, 1, 0];
for (let b = 0; b < bars; b++) for (let e = 0; e < 8; e++) {
  const t = b * BAR + e * BEAT / 2, s = sec(t);
  const build = s === "build" && bp(t) >= 0.25;
  if (!(s === "groove" || s === "finale" || s === "tech" || build)) continue;
  if (!build && !BASS[e]) continue;
  if (t > S.logo - 0.35 && t < S.logo) continue; // silence before the drop
  const f = mtof(ROOTS[b % 4] + (e === 6 ? 7 : 0));
  add(t, 0.32, (u) => { const v = Math.sin(TAU * f * u) + 0.3 * Math.sin(TAU * 2 * f * u); return Math.tanh(v * 1.4) * Math.exp(-u * 7) * Math.min(1, u / 0.004); }, { gain: build ? 0.16 * bp(t) : 0.26, ducked: true });
}

// Pluck arp (marimba-ish)
const ARP = [0, 1, 2, 3, 2, 1, 2, 3];
for (let b = 0; b < bars; b++) for (let e = 0; e < 8; e++) {
  const t = b * BAR + e * BEAT / 2, s = sec(t);
  if (!(s === "groove" || s === "finale" || s === "tech")) continue;
  const m = CHORDS[b % 4][ARP[e]] + 24 + (s === "finale" && e % 4 === 3 ? 12 : 0);
  const f = mtof(m), dark = s === "tech";
  const f1 = lp(dark ? 0.08 : 0.5);
  add(t, 0.6, (u) => f1(Math.sin(TAU * f * u) + 0.35 * Math.sin(TAU * 4 * f * u) * Math.exp(-u * 30)) * Math.exp(-u * 7.5), { gain: dark ? 0.09 : 0.075, pan: e % 2 ? 0.35 : -0.35, send: 0.35 });
}
// Bell motif in the cold open
[[0.6, 74], [1.8, 78], [3.0, 81], [4.2, 76], [6.6, 74], [7.8, 73]].forEach(([t, m]) => {
  const f = mtof(m); add(t, 3, (u) => (Math.sin(TAU * f * u + 1.2 * Math.sin(TAU * f * 3.5 * u) * Math.exp(-u * 3))) * Math.exp(-u * 1.6), { gain: 0.05, pan: 0.2, send: 0.9 });
});

// Clap and shaker
for (let b = 0; b < bars; b++) for (let q = 0; q < 4; q++) {
  const t = b * BAR + q * BEAT, s = sec(t);
  if (!(s === "groove" || s === "finale")) continue;
  if (t >= S.compete && t < S.compete + BAR) continue;
  if (q % 2 === 1) { const bp = hpf(0.25), l2 = lp(0.35); add(t, 0.35, (u) => { const e = u < 0.03 ? (Math.exp(-((u % 0.01) * 400))) : Math.exp(-(u - 0.03) * 18); return l2(bp(noise())) * e; }, { gain: 0.22, send: 0.4 }); }
}
for (let b = 0; b < bars; b++) for (let x = 0; x < 16; x++) {
  const t = b * BAR + x * BEAT / 4, s = sec(t);
  if (!(s === "groove" || s === "finale" || s === "tech")) continue;
  const hp = hpf(0.6), acc = x % 4 === 2 ? 1 : x % 2 ? 0.45 : 0.6;
  add(t, 0.08, (u) => hp(noise()) * Math.exp(-u * 55), { gain: 0.05 * acc * (s === "tech" ? 0.6 : 1), pan: 0.25 });
}

// Ocean: brown noise with slow swells, loudest at the start and the end
{
  const l1 = lp(0.02), l2 = lp(0.02), m1 = lp(0.03), lv = lp(0.00006); let br = 0, br2 = 0;
  add(0, DUR, (u, t) => {
    br = br * 0.995 + noise() * 0.06; br2 = br2 * 0.995 + noise() * 0.06;
    const sw = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(TAU * t / 6.5 - 1.5), 2);
    const lvl = t < S.problem ? 1 : t < S.logo ? 0.55 : t < S.finale ? 0.08 : t < S.end - 3 ? 0.35 : 0.9;
    return (l1(br) + m1(l2(br2)) * 0.6) * sw * lv(lvl);
  }, { gain: 0.9 });
}

// ---------- sound effects ----------
const FX = {
  whoosh: (t, g, soft) => { const f = lp(0.02), f2 = lp(0.2); add(t - 0.35, 0.8, (u) => { const k = u / 0.8; const c = 0.01 + 0.25 * Math.sin(Math.PI * k) ** 2; return f2(f(noise()) + 0) * Math.sin(Math.PI * k) ** 2 * (1 + 8 * c); }, { gain: (soft ? 0.25 : 0.45) * g, send: 0.3, pan: 0.0 }); },
  thud: (t, g) => add(t, 0.4, (u) => Math.sin(TAU * (60 * u + 3 * (1 - Math.exp(-u * 20)))) * Math.exp(-u * 9) + noise() * Math.exp(-u * 120) * 0.3, { gain: 0.5 * g, send: 0.2 }),
  pop: (t, g) => { const p = rnd() * 0.6 - 0.3, f0 = 700 + rnd() * 500; add(t, 0.12, (u) => Math.sin(TAU * (f0 * u - 2600 * u * u)) * Math.exp(-u * 40), { gain: 0.32 * g, pan: p, send: 0.25 }); },
  shimmer: (t, g) => { for (let i = 0; i < 14; i++) { const f = mtof([74, 76, 78, 81, 83, 86, 88, 90][i % 8] + (i > 7 ? 12 : 0)), d = i * 0.09; add(t + d, 2.2, (u) => Math.sin(TAU * f * u) * Math.min(1, u / 0.05) * Math.exp(-u * 2.2), { gain: 0.04 * g, pan: (i % 5) / 2.5 - 0.8, send: 0.9 }); } },
  riser: (t, g, _s, dur = 1.8) => { const h = hpf(0.05), l = lp(0.3); add(t, dur, (u) => { const k = u / dur; return (l(h(noise())) * 0.8 + 0.25 * Math.sin(TAU * (200 * u + 600 * u * u / dur))) * k * k; }, { gain: 0.35 * g, send: 0.5 }); },
  impact: (t, g) => { add(t, 1.6, (u) => Math.sin(TAU * (38 * u + 8 * (1 - Math.exp(-u * 10)))) * Math.exp(-u * 3) * 1.1, { gain: 0.55 * g }); const h = hpf(0.3); add(t, 2.0, (u) => h(noise()) * Math.exp(-u * 2.4) * 0.5, { gain: 0.35 * g, send: 0.8 }); },
  sparkle: (t, g) => [86, 88, 90, 93, 95, 98].forEach((m, i) => { const f = mtof(m); add(t + i * 0.045, 0.6, (u) => Math.sin(TAU * f * u) * Math.exp(-u * 8), { gain: 0.05 * g, pan: i / 3 - 0.8, send: 0.8 }); }),
  tap: (t, g) => add(t, 0.05, (u) => (Math.sin(TAU * 1700 * u) * 0.6 + noise() * 0.4) * Math.exp(-u * 160), { gain: 0.35 * g }),
  ding: (t, g) => [[86, 1], [93, 0.5], [98, 0.25]].forEach(([m, a]) => { const f = mtof(m); add(t, 2.0, (u) => Math.sin(TAU * f * u + 0.6 * Math.sin(TAU * f * 2 * u) * Math.exp(-u * 6)) * Math.exp(-u * 2.6) * a, { gain: 0.11 * g, send: 0.7 }); }),
  shutter: (t, g) => { const b = hpf(0.4); [0, 0.075].forEach((d, i) => add(t + d, 0.06, (u) => b(noise()) * Math.exp(-u * 90) + Math.sin(TAU * (i ? 900 : 1300) * u) * Math.exp(-u * 120) * 0.5, { gain: 0.45 * g })); },
  scan: (t, g) => add(t, 1.4, (u) => Math.sin(TAU * (380 * u + 450 * u * u)) * (0.5 + 0.5 * Math.sin(TAU * 18 * u)) * Math.sin(Math.PI * u / 1.4), { gain: 0.05 * g, send: 0.5 }),
  blip: (t, g) => add(t, 0.1, (u) => Math.sign(Math.sin(TAU * (1200 + 2000 * u) * u)) * 0.4 * Math.exp(-u * 45), { gain: 0.12 * g, pan: 0.2, send: 0.3 }),
  type: (t, g) => { for (let i = 0; i < 22; i++) add(t + i * 0.045 + rnd() * 0.01, 0.02, (u) => noise() * Math.exp(-u * 400), { gain: 0.18 * g, pan: rnd() * 0.4 - 0.2 }); },
  drop: (t, g) => add(t - 0.15, 0.3, (u) => Math.sin(TAU * (1300 * u - 1500 * u * u)) * Math.exp(-u * 10) * 0.6, { gain: 0.25 * g, send: 0.4 }),
  snap: (t, g) => add(t, 0.12, (u) => Math.sin(TAU * (500 * u + 2500 * u * u)) * Math.exp(-u * 35), { gain: 0.3 * g, send: 0.3 }),
  swipe: (t, g) => { const f = lp(0.08); add(t, 1.3, (u) => f(noise()) * Math.sin(Math.PI * u / 1.3) * 3, { gain: 0.25 * g, pan: -0.3 }); },
  count: (t, g) => { for (let i = 0; i < 20; i++) { const f = 700 + i * 55; add(t + 1.4 * (1 - Math.pow(1 - i / 20, 2)), 0.05, (u) => Math.sin(TAU * f * u) * Math.exp(-u * 90), { gain: 0.16 * g, send: 0.2 }); } },
};
FX.whooshSoft = (t, g) => FX.whoosh(t, g, true);
const impacts = TL.CUES.filter((c) => c[1] === "impact").map((c) => c[0]);
for (const [t, k, g] of TL.CUES) {
  if (k === "riser") { const next = impacts.find((x) => x > t) ?? t + 1.8; FX.riser(t, g, 0, Math.min(1.8, next - t)); continue; }
  FX[k](t, g);
}

// ---------- reverb (Schroeder), mix, master ----------
function reverb(inp, off) {
  const out = new Float32Array(N);
  const combs = [1687, 1601, 2053, 2251].map((d) => ({ d: d + off, b: new Float32Array(d + off), i: 0, y: 0 }));
  const aps = [347, 113].map((d) => ({ d, b: new Float32Array(d), i: 0 }));
  for (let s = 0; s < N; s++) {
    let acc = 0;
    for (const c of combs) { const o = c.b[c.i]; c.y = o * 0.7 + c.y * 0.3; c.b[c.i] = inp[s] + c.y * 0.86; c.i = (c.i + 1) % c.d; acc += o; }
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
const fadeOut = (s) => Math.min(1, (N - s) / (0.8 * SR));
for (let s = 0; s < N; s++) {
  const f = fadeOut(s) * Math.min(1, s / (0.05 * SR));
  buf.writeInt16LE(Math.round(Math.tanh(L[s] * pre) * 0.89 * f * 32767), 44 + s * 4);
  buf.writeInt16LE(Math.round(Math.tanh(R[s] * pre) * 0.89 * f * 32767), 46 + s * 4);
}
mkdirSync(join(here, "out"), { recursive: true });
writeFileSync(join(here, SHORT ? "out/soundtrack-30s.wav" : "out/soundtrack.wav"), buf);
console.log("soundtrack", DUR.toFixed(1) + "s", "peak", peak.toFixed(2));
