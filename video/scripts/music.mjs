// Synthesizes the soundtrack and sound effects for the explainer -> video/out/music.wav
// 120 BPM (one bar = 2 s), so every scene change lands on a bar line.
import { writeFileSync, mkdirSync } from "node:fs";

const SR = 44100, DUR = 76.5, N = Math.ceil(SR * DUR);
const Lb = new Float32Array(N), Rb = new Float32Array(N);
const BEAT = 0.5, BAR = 2;

let seed = 1;
const noise = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2147483648 - 1; };
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function put(t0, len, fn, gain = 1, pan = 0) {
  const s0 = Math.floor(t0 * SR), n = Math.floor(len * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4) * Math.SQRT2, gr = gain * Math.sin(((pan + 1) * Math.PI) / 4) * Math.SQRT2;
  for (let i = 0; i < n; i++) {
    const j = s0 + i;
    if (j < 0 || j >= N) continue;
    const v = fn(i / SR, i);
    Lb[j] += v * gl; Rb[j] += v * gr;
  }
}
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));
const TAU = 2 * Math.PI;

// ---------- instruments ----------
function marimba(t0, m, vel = 1, pan = 0) {
  const f = mtof(m);
  put(t0, 1.2, (t) => {
    const e = env(t, 0.002, 0.32);
    return vel * 0.22 * (Math.sin(TAU * f * t) * e + 0.35 * Math.sin(TAU * f * 4 * t) * env(t, 0.001, 0.05) + 0.12 * Math.sin(TAU * f * 9.9 * t) * env(t, 0.001, 0.02));
  }, 1, pan);
}
function pluck(t0, m, vel = 1, pan = 0) { // bright ukulele-ish pluck
  const f = mtof(m);
  put(t0, 0.9, (t) => {
    const e = env(t, 0.003, 0.18);
    let v = 0;
    for (let h = 1; h <= 6; h++) v += Math.sin(TAU * f * h * t) * Math.exp(-t * (4 + h * 5)) / h;
    return vel * 0.16 * v * (e > 0 ? 1 : 0);
  }, 1, pan);
}
function pad(t0, len, notes, vel = 1) {
  const fs = notes.map(mtof);
  put(t0, len + 0.8, (t) => {
    const e = Math.min(1, t / 0.5) * (t > len ? Math.exp(-(t - len) / 0.3) : 1);
    let v = 0;
    for (const f of fs) v += Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 1.004 * t + 1) + 0.18 * Math.sin(TAU * f * 2 * t);
    return vel * 0.035 * e * v * (0.85 + 0.15 * Math.sin(TAU * 0.5 * t));
  });
}
function bass(t0, m, len = 0.4, vel = 1) {
  const f = mtof(m);
  put(t0, len + 0.15, (t) => {
    const e = Math.min(1, t / 0.005) * (t < len ? Math.exp(-t / 0.6) : Math.exp(-len / 0.6) * Math.exp(-(t - len) / 0.04));
    return vel * 0.34 * e * (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * 2 * f * t) + 0.08 * Math.sin(TAU * 3 * f * t));
  });
}
function kick(t0, vel = 1) {
  let ph = 0;
  put(t0, 0.45, (t) => { const f = 48 + 110 * Math.exp(-t * 32); ph += TAU * f / SR; return vel * 0.75 * Math.sin(ph) * Math.exp(-t * 7.5) + vel * 0.15 * noise() * Math.exp(-t * 300); });
}
function svf(fc, q = 0.7) { let low = 0, band = 0; return (x, f = fc) => { const F = 2 * Math.sin((Math.PI * Math.min(f, SR / 6)) / SR); low += F * band; const high = x - low - q * band; band += F * high; return { low, band, high }; }; }
function clap(t0, vel = 1) {
  const fl = svf(1400, 0.9);
  put(t0, 0.3, (t) => { const burst = (t < 0.01 ? 1 : t < 0.02 ? 0.6 : t < 0.03 ? 0.8 : 1) * Math.exp(-t * 18); return vel * 0.55 * fl(noise()).band * burst; }, 1, 0.1);
}
function shaker(t0, vel = 1, pan = 0.35) {
  const fl = svf(7000, 0.8);
  put(t0, 0.09, (t) => vel * 0.16 * fl(noise()).high * Math.min(1, t / 0.006) * Math.exp(-t * 45), 1, pan);
}
function hat(t0, vel = 1) {
  const fl = svf(9000, 0.6);
  put(t0, 0.05, (t) => vel * 0.1 * fl(noise()).high * Math.exp(-t * 90), 1, -0.3);
}

// ---------- sound effects ----------
function whoosh(t0, len = 0.9, up = true, vel = 1) {
  const fl = svf(400, 1.1);
  put(t0, len, (t) => {
    const k = t / len, f = up ? 250 + 3800 * k * k : 4000 - 3700 * k;
    return vel * 0.42 * fl(noise(), f).band * Math.sin(Math.PI * k) ** 1.5;
  }, 1, up ? -0.2 : 0.2);
}
function pop(t0, f = 700, vel = 1, pan = 0) {
  let ph = 0;
  put(t0, 0.14, (t) => { ph += (TAU * f * (1 + 1.4 * Math.exp(-t * 60))) / SR; return vel * 0.3 * Math.sin(ph) * Math.exp(-t * 32); }, 1, pan);
}
function tap(t0) { put(t0, 0.04, (t) => 0.22 * (Math.sin(TAU * 1700 * t) + 0.6 * noise()) * Math.exp(-t * 160)); }
function shutter(t0) {
  const fl = svf(3200, 0.8);
  put(t0, 0.16, (t) => { const c = (t < 0.012 ? 1 : 0) + (t > 0.07 && t < 0.085 ? 0.8 : 0); return 0.5 * fl(noise()).band * c + 0.14 * noise() * Math.exp(-t * 60); });
}
function bell(t0, m, vel = 1, pan = 0) {
  const f = mtof(m);
  put(t0, 1.6, (t) => vel * 0.14 * (Math.sin(TAU * f * t) * Math.exp(-t * 2.4) + 0.5 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * 6) + 0.25 * Math.sin(TAU * f * 5.4 * t) * Math.exp(-t * 11)) * Math.min(1, t / 0.002), 1, pan);
}
const coin = (t0) => { bell(t0, 83, 1); bell(t0 + 0.08, 88, 1.1); };
function sparkle(t0, base = 84, n = 5) { for (let i = 0; i < n; i++) bell(t0 + i * 0.045, base + [0, 4, 7, 11, 12, 16, 19][i % 7], 0.45, (i % 2 ? 0.5 : -0.5)); }
function thud(t0, f = 110) { let ph = 0; put(t0, 0.35, (t) => { ph += (TAU * (f * 0.55 + f * Math.exp(-t * 20))) / SR; return 0.55 * Math.sin(ph) * Math.exp(-t * 12) + 0.08 * noise() * Math.exp(-t * 40); }); }
function scan(t0, len) { put(t0, len, (t) => { const k = t / len; return 0.05 * Math.sin(TAU * (600 + 900 * ((k * 2) % 1)) * t) * Math.sin(Math.PI * k) * (0.6 + 0.4 * Math.sin(TAU * 18 * t)); }); }
function tick(t0, m = 96) { put(t0, 0.03, (t) => 0.09 * Math.sin(TAU * mtof(m) * t) * Math.exp(-t * 140), 1, 0.2); }
function fanfare(t0, root = 72) { [0, 4, 7, 12, 16].forEach((d, i) => { marimba(t0 + i * 0.07, root + d, 1.1, (i - 2) * 0.2); bell(t0 + i * 0.07, root + 12 + d, 0.5); }); }
function riser(t0, len) { const fl = svf(300, 0.9); put(t0, len, (t) => { const k = t / len; return 0.18 * fl(noise(), 300 + 6000 * k * k).band * k * k; }); }

// ---------- music ----------
// I – V – vi – IV in C, one chord per bar
const CH = [[48, [60, 64, 67]], [43, [59, 62, 67]], [45, [60, 64, 69]], [41, [60, 65, 69]]];
const SCALE = [72, 74, 76, 79, 81, 84];
const melodyPat = [0, 2, 4, 2, 3, 1, 2, 0, 1, 3, 5, 3, 4, 2, 1, 2];
const bars = Math.ceil(DUR / BAR);
for (let b = 0; b < bars; b++) {
  const t = b * BAR, [root, chord] = CH[b % 4];
  const end = t >= 74;
  if (end) break;
  const intro = t < 6, outro = t >= 72, breath = t >= 38 && t < 40;
  pad(t, BAR, chord, intro ? 1.2 : 0.9);
  // arpeggio
  for (let s = 0; s < 8; s++) {
    const note = chord[(s * 2 + (b % 2)) % 3] + (s % 4 === 3 ? 12 : 0);
    marimba(t + s * 0.25, note + 12, intro ? 0.6 + 0.05 * s : 0.55, s % 2 ? 0.35 : -0.35);
  }
  if (!intro && !outro) {
    // drums
    for (let q = 0; q < 4; q++) {
      if (!breath || q < 2) kick(t + q * BEAT, q % 2 ? 0.75 : 1);
      if (q % 2 === 1 && !breath) clap(t + q * BEAT, 0.8);
      for (let s = 0; s < 4; s++) shaker(t + q * BEAT + s * 0.125, s === 2 ? 1 : s % 2 ? 0.55 : 0.35);
      hat(t + q * BEAT + 0.25, 0.8);
    }
    // bass: island bounce
    bass(t, root, 0.35); bass(t + 0.75, root, 0.2, 0.8); bass(t + 1.0, root + 7, 0.3, 0.9); bass(t + 1.5, root + 12, 0.2, 0.7); bass(t + 1.75, root + 7, 0.2, 0.6);
    // lead melody on the main sections
    if (t >= 14 && t < 68 && !breath) {
      for (let s = 0; s < 8; s++) {
        if ((b * 8 + s) % 3 === 2 && s % 2) continue;
        const idx = melodyPat[(b * 8 + s) % 16];
        if (s % 2 === 0 || (b % 2 === 1 && s === 5)) pluck(t + s * 0.25, SCALE[idx] - (t >= 58 ? 0 : 12), 0.8, 0.15);
      }
    }
  } else if (outro) {
    if (t === 72) { pad(t, 4, [60, 64, 67, 72], 1.4); bass(t, 36, 3.5, 0.8); }
  } else if (t >= 2) {
    for (let q = 0; q < 4; q++) for (let s = 0; s < 2; s++) shaker(t + q * BEAT + s * 0.25, 0.4 + s * 0.3);
  }
}
// final chord ring
pad(74, 2, [48, 55, 64, 67, 72], 1.3);
[60, 64, 67, 72, 76, 79, 84].forEach((m, i) => marimba(74 + i * 0.06, m, 0.7, (i - 3) * 0.15));
bass(74, 36, 1.8, 0.9);

// ---------- cue sheet (matches anim.js) ----------
// S1 intro
pop(0.35, 520, 1.2); sparkle(0.45, 84, 4);
"HaiPantai".split("").forEach((_, i) => pop(1.0 + i * 0.055 + (i > 2 ? 0.055 : 0), 600 + i * 70, 0.6, (i - 4) * 0.1));
tick(2.0); tick(2.27); tick(2.54); pop(3.15, 900, 0.7);
whoosh(5.4, 1.2, true, 1.2);
// S2
for (let i = 0; i < 28; i++) if (i % 2 === 0) pop(8.4 + i * 0.055, 500 + (i % 7) * 90, 0.5, Math.sin(i) * 0.6);
pop(11.6, 700); pop(12.0, 820); pop(12.4, 980);
riser(12.6, 1.4); whoosh(13.0, 1.2, true, 1.1);
// S3 report
tap(16.4); whoosh(16.5, 0.5, true, 0.6); tap(17.62); shutter(17.75); scan(18.0, 0.9);
pop(19.05, 900, 0.8); pop(19.35, 1000, 0.8); tap(19.85); whoosh(20.0, 0.5, false, 0.6);
tap(20.72); thud(20.85, 160); pop(21.25, 1200, 0.7); bell(21.35, 88, 0.6);
tap(22.28); coin(22.5); sparkle(22.6, 88, 6);
pop(22.7, 700, 0.6); pop(23.1, 700, 0.6); pop(23.32, 820, 0.6); pop(23.54, 980, 0.6);
whoosh(25.5, 1.0, true, 1.0);
// S4 clean
tap(27.6); tap(28.58); shutter(28.62); whoosh(29.0, 0.9, true, 0.5); scan(30.0, 1.0);
for (let i = 0; i < 9; i++) tick(31.1 + i * 0.08, 90 + i);
coin(31.9); pop(31.5, 800, 0.5);
[32.1, 32.45, 32.8, 33.15].forEach((t, i) => pop(t, 600 + i * 130, 0.7));
for (let i = 0; i < 6; i++) tick(33.2 + i * 0.08, 92 + i);
whoosh(33.55, 0.6, true, 0.6); bell(33.65, 79, 0.8); for (let i = 0; i < 8; i++) tick(34.0 + i * 0.07, 95 + i);
coin(34.6); sparkle(34.65, 84, 7);
whoosh(37.5, 1.0, false, 1.0);
// S5 health
[39.8, 40.6, 41.4, 42.2, 42.9].forEach((t, i) => { thud(t + 0.25, 150 - i * 15); pop(t + 0.3, 300 - i * 25, 0.5); });
[43.9, 44.5, 45.1, 45.7, 46.3].forEach((t, i) => { sparkle(t, 79 + i * 2, 3); bell(t + 0.2, 76 + [0, 2, 4, 7, 12][i], 0.7); });
fanfare(46.6, 72);
whoosh(47.5, 1.0, true, 1.0);
// S6 league
[49.7, 51.0, 52.3].forEach((t, i) => { whoosh(t, 0.6, true, 0.6); bell(t + 0.3, 79 + i * 3, 0.6); });
fanfare(53.2, 76); sparkle(53.5, 88, 7);
pop(54.6, 600, 0.6);
whoosh(57.3, 1.1, true, 1.0);
// S7 badges + challenge
for (let i = 0; i < 6; i++) { pop(59.0 + i * 0.25, 700 + i * 60, 0.6); bell(59.05 + i * 0.25, [84, 86, 88, 91, 93, 96][i], 0.5, (i - 2.5) * 0.2); }
pop(61.6, 500, 0.6);
for (let i = 0; i < 26; i++) tick(62.5 + i * 0.1, 84 + Math.floor(i / 2));
fanfare(65.1, 79); sparkle(65.2, 91, 7);
whoosh(67.4, 1.2, true, 1.2);
// S8 outro
pop(68.3, 700); pop(68.6, 820); pop(68.9, 980);
whoosh(70.8, 0.9, false, 0.8); pop(71.4, 520, 1.1); sparkle(71.5, 84, 6);

// ---------- master ----------
let peak = 0;
for (let i = 0; i < N; i++) {
  const fade = i / SR > DUR - 1.4 ? Math.max(0, (DUR - i / SR) / 1.4) : 1;
  const fi = Math.min(1, i / (SR * 0.05));
  Lb[i] = Math.tanh(Lb[i] * 1.1) * fade * fi; Rb[i] = Math.tanh(Rb[i] * 1.1) * fade * fi;
  peak = Math.max(peak, Math.abs(Lb[i]), Math.abs(Rb[i]));
}
const g = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(Lb[i] * g * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(Rb[i] * g * 32767), 46 + i * 4); }
mkdirSync(new URL("../out/", import.meta.url), { recursive: true });
writeFileSync(new URL("../out/music.wav", import.meta.url), buf);
console.log("music.wav", DUR + "s", "peak", peak.toFixed(2));
