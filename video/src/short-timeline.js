// The 30-second cut: a shot list over the full film's scenes.
// Each shot plays scene time a..b at `speed`. Shots last 1 or 2 bars (2.4 s), so
// cuts land on the beat. The sound cues are remapped from the full film.
(function (root) {
  const TL = typeof module !== "undefined" ? require("./timeline.js") : root.TL;
  const SHOTS = [
    { scene: "problem", a: 0.6, b: 4.2, speed: 1.5 },   // the coast draws, 173 beaches, trash pops
    { scene: "problem", a: 7.2, b: 9.6, speed: 1 },     // what if the coast was a game?
    { scene: "logo", a: 0, b: 4.8, speed: 1 },          // the drop
    { scene: "report", a: 2.0, b: 10.4, speed: 1.75 },  // photo, Claude tags it, pin snaps, +40
    { scene: "clean", a: 0.2, b: 2.6, speed: 1 },       // hotspot, I cleaned this
    { scene: "clean", a: 9.4, b: 11.8, speed: 1 },      // +220, the pin turns green
    { scene: "compete", a: 3.4, b: 8.2, speed: 2 },     // health drops, cleanups, the crown
    { scene: "tech", a: 0.4, b: 7.6, speed: 1.5 },      // under the hood
    { scene: "finale", a: 1.2, b: 9.6, speed: 1.75 },   // the coast turns green, logo, demo link
  ];
  let T = 0;
  for (const s of SHOTS) { s.t0 = T; s.dur = (s.b - s.a) / s.speed; T += s.dur; }
  const at = (name, i = 0) => SHOTS.filter((s) => s.scene === name)[i].t0;

  // Music sections for audio.mjs (same keys as the full film)
  const S = { cold: 0, problem: 0, logo: at("logo"), compete: -99, tech: at("tech"), finale: at("finale"), end: T };

  const CUES = [];
  for (const s of SHOTS) {
    const base = TL.S[s.scene];
    for (const [t, k, g] of TL.CUES) {
      const lt = t - base;
      if (lt >= s.a && lt < s.b && k !== "riser" && !(k === "whoosh" && lt > s.b - 1)) CUES.push([+(s.t0 + (lt - s.a) / s.speed).toFixed(3), k, g]);
    }
  }
  CUES.push([+(S.logo - 1.6).toFixed(3), "riser", 1]);
  CUES.push([+(S.finale - 1.2).toFixed(3), "riser", 0.8], [S.finale, "impact", 1], [S.finale + 0.1, "shimmer", 0.8]);
  for (const s of SHOTS.slice(1)) if (s.t0 !== S.logo && s.t0 !== S.finale) CUES.push([+(s.t0 - 0.15).toFixed(3), "whooshSoft", 0.45]);
  CUES.sort((x, y) => x[0] - y[0]);

  const SHORT = { BEAT: TL.BEAT, BAR: TL.BAR, S, CUES, SHOTS, DURATION: T };
  if (typeof module !== "undefined") module.exports = SHORT; else root.SHORT_TL = SHORT;
})(typeof window !== "undefined" ? window : globalThis);
