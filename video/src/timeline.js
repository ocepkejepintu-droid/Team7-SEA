// Shared by the page (window.TL) and the soundtrack (module.exports).
// 100 BPM: one beat is 0.6 s, one bar is 2.4 s. Every scene starts on a bar.
(function (root) {
  const BEAT = 0.6, BAR = 2.4;
  const S = {
    cold: 0,          // 4 bars  the tide brings trash
    problem: 9.6,     // 4 bars  173 beaches, nobody keeps score
    logo: 19.2,       // 3 bars  Hai Pantai (the drop)
    steps: 26.4,      // 2 bars  report, clean, compete
    report: 31.2,     // 6 bars  step 01
    clean: 45.6,      // 6 bars  step 02
    compete: 60.0,    // 6 bars  step 03
    workshop: 74.4,   // 4 bars  step 04: reuse it
    game: 84.0,       // 4 bars  badges, hotspots, challenge, players
    tech: 93.6,       // 4 bars  under the hood
    finale: 103.2,    // 4 bars  the coast turns green
    end: 112.8,
  };

  // Sound cues, [time, kind, gain]
  const C = [];
  const q = (t, k, g = 1) => C.push([+t.toFixed(3), k, g]);

  // cold open
  q(S.cold + 2.2, "whooshSoft", 0.5);
  q(S.cold + 4.8, "thud", 0.6); q(S.cold + 5.4, "thud", 0.6); q(S.cold + 6.0, "thud", 0.7);
  q(S.cold + 8.9, "whoosh", 0.8);
  // problem: coast draws, then trash pops
  q(S.problem + 0.6, "shimmer", 0.6);
  for (let i = 0; i < 26; i++) q(S.problem + 3.0 + i * 0.115 + ((i * 37) % 7) * 0.01, "pop", 0.35 + (i % 3) * 0.1);
  q(S.problem + 7.8, "riser", 1);
  // logo
  q(S.logo, "impact", 1);
  q(S.logo + 0.3, "sparkle", 0.6);
  q(S.logo + 1.8, "tap", 0.5); q(S.logo + 2.4, "tap", 0.5); q(S.logo + 3.0, "ding", 0.6);
  q(S.logo + 6.5, "whoosh", 0.7);
  // steps
  q(S.steps + 0.3, "pop", 0.8); q(S.steps + 0.75, "pop", 0.8); q(S.steps + 1.2, "pop", 0.85); q(S.steps + 1.65, "pop", 0.9);
  q(S.steps + 4.1, "whoosh", 0.8);
  // report
  q(S.report + 0.2, "whooshSoft", 0.6);
  q(S.report + 1.9, "tap", 0.9);
  q(S.report + 3.0, "shutter", 1);
  q(S.report + 3.6, "scan", 0.7);
  q(S.report + 4.2, "blip", 0.6); q(S.report + 4.5, "blip", 0.6); q(S.report + 4.8, "blip", 0.7);
  q(S.report + 5.3, "type", 0.5);
  q(S.report + 6.6, "drop", 0.8); q(S.report + 7.2, "snap", 0.8);
  q(S.report + 7.9, "tap", 0.9);
  q(S.report + 9.0, "drop", 0.9); q(S.report + 9.4, "ding", 0.9); q(S.report + 10.0, "sparkle", 0.5);
  // clean
  q(S.clean + 2.2, "tap", 0.9);
  q(S.clean + 3.2, "shutter", 1);
  q(S.clean + 3.6, "swipe", 0.7);
  q(S.clean + 5.0, "count", 0.8);
  q(S.clean + 6.6, "ding", 0.8);
  q(S.clean + 8.0, "tap", 0.5); q(S.clean + 8.6, "tap", 0.6);
  q(S.clean + 9.2, "impact", 0.7); q(S.clean + 9.25, "sparkle", 0.9);
  q(S.clean + 10.9, "pop", 0.9);
  q(S.clean + 11.4, "ding", 0.6); q(S.clean + 11.8, "ding", 0.7);
  q(S.clean + 13.8, "whoosh", 0.7);
  // compete
  for (let i = 0; i < 5; i++) q(S.compete + 1.2 + i * 0.6, "thud", 0.7);
  for (let i = 0; i < 4; i++) q(S.compete + 4.8 + i * 0.6, "sparkle", 0.45);
  q(S.compete + 7.6, "impact", 0.6); q(S.compete + 7.65, "ding", 0.8);
  q(S.compete + 13.8, "whoosh", 0.7);
  // workshop
  q(S.workshop + 0.2, "whooshSoft", 0.6);
  q(S.workshop + 1.4, "tap", 0.9);
  q(S.workshop + 1.6, "swipe", 0.6);
  for (let i = 0; i < 3; i++) q(S.workshop + 2.4 + i * 0.2, "pop", 0.6);
  q(S.workshop + 3.4, "tap", 0.6);
  q(S.workshop + 4.8, "tap", 0.9);
  for (let i = 0; i < 4; i++) q(S.workshop + 5.8 + i * 0.3, "blip", 0.5);
  q(S.workshop + 6.8, "sparkle", 0.6);
  q(S.workshop + 9.0, "whoosh", 0.6);
  // game layer
  for (let i = 0; i < 6; i++) q(S.game + 0.6 + i * 0.3, "pop", 0.7);
  q(S.game + 5.0, "ding", 0.8);
  q(S.game + 9.0, "whoosh", 0.8);
  // tech
  q(S.tech + 0.3, "blip", 0.6);
  for (let i = 0; i < 5; i++) q(S.tech + 1.0 + i * 0.6, "blip", 0.5);
  q(S.tech + 8.9, "riser", 0.8);
  // finale
  q(S.finale, "impact", 1);
  q(S.finale + 0.4, "shimmer", 1);
  q(S.finale + 4.4, "sparkle", 0.8);
  q(S.finale + 6.0, "ding", 0.6);

  const TL = { BEAT, BAR, S, CUES: C, DURATION: S.end };
  if (typeof module !== "undefined") module.exports = TL; else root.TL = TL;
})(typeof window !== "undefined" ? window : globalThis);
