// "Built in one hour": scene times, the build clock and every sound cue.
// The page and the soundtrack (audio.mjs) both read this file, so they stay in sync.
// 120 BPM: a beat is 0.5 s and a bar is 2 s. The film is 30 s.
(function (root) {
  const BEAT = 0.5, BAR = 2, DURATION = 30;
  // Scenes in film time. `base` is how long the scene's own animation runs (its local clock);
  // the scene plays it at speed base/dur so the whole film fits 30 s.
  const SEG = [
    ["hook", 0, 3, 3],
    ["product", 3, 5.5, 6],
    ["rewind", 8.5, 1.25, 1.5],
    ["master", 9.75, 2.25, 2.5],
    ["swarm", 12, 4, 4.5],
    ["agents", 16, 3, 3.5],
    ["humans", 19, 3.25, 3.5],
    ["github", 22.25, 2.5, 3],
    ["film", 24.75, 2.75, 2.75],
    ["finale", 27.5, 2.5, 2.5],
  ].map(([name, t0, dur, base]) => ({ name, t0, dur, t1: t0 + dur, base, speed: base / dur }));
  const S = { end: DURATION };
  for (const s of SEG) S[s.name] = s.t0;
  const segOf = (name) => SEG.find((s) => s.name === name);
  // scene-local time -> film time
  const at = (name, local) => { const s = segOf(name); return +(s.t0 + local / s.speed).toFixed(3); };

  // Real commits from the build hour (git log, times in WITA = UTC+8). The hour is counted
  // from the first line of code (the scaffold at 15:14:41) to the launch film at 16:14:50.
  const hms = (s) => { const [h, m, x] = s.split(":").map(Number); return (h - 15) * 3600 + m * 60 + x; };
  const COMMITS = [
    ["15:14:41", "2922bb3", "chore: scaffold workspaces, tokens and contracts"],
    ["15:17:43", "d0d273e", "chore: VPS deploy kit, release script and README"],
    ["15:17:54", "497303c", "feat: game rules for points, hotspots and league"],
    ["15:18:48", "d4b6df1", "feat: derive Bali beaches from desa polygons"],
    ["15:19:06", "97ea0c2", "wip: server, app shell and map (checkpoint)"],
    ["15:20:26", "0418526", "feat: app shell, onboarding, league and profile"],
    ["15:22:01", "57775c9", "feat: API with store, photos and Claude vision"],
    ["15:29:17", "9e1c350", "feat: game map, report and cleanup flows"],
    ["15:44:54", "42dfeaf", "fix: review findings (token budget, JPEG check)"],
    ["15:45:13", "4f7298a", "chore: rename app to Hai Pantai"],
    ["15:50:41", "b92d0a5", "Merge pull request #1", 1],
    ["15:54:40", "261ed7e", "chore: rebuild release with the Hai Pantai name"],
    ["15:54:52", "a87eaa7", "feat: Instagram story share cards"],
    ["15:55:25", "29461c2", "Merge pull request #2", 2],
    ["15:56:58", "15cfa28", "feat: English, 中文, Indonesian; light + dark"],
    ["15:58:09", "c958ec4", "chore: rebuild release with the share cards"],
    ["15:58:47", "aeffc30", "chore: keep the unpacked release out of git"],
    ["16:00:38", "158a6b6", "Use new Hai Pantai logo for app and favicon"],
    ["16:00:51", "5ead2ff", "feat: Workshop tab with reuse guides"],
    ["16:01:12", "1122820", "Merge pull request #4", 4],
    ["16:02:11", "8374a06", "Merge default branch; rebuild with Workshop"],
    ["16:02:24", "6d4fb83", "docs: explain how the app works"],
    ["16:02:32", "49aff96", "Merge base into share cards"],
    ["16:02:38", "627d7e8", "Merge pull request #3", 3],
    ["16:03:11", "8d6c328", "Merge remote-tracking branch into walkthrough"],
    ["16:03:18", "7ff3e18", "docs: cover the share cards in the walkthrough"],
    ["16:07:04", "2ac5619", "Merge default; translate Workshop UI"],
    ["16:09:36", "4e259d5", "Merge pull request #5", 5],
    ["16:12:13", "706cc4e", "chore: rebuild release bundle with the new logo"],
    ["16:14:50", "e52f791", "feat: launch film for Hai Pantai, made in code", 0, "film"],
    ["16:15:00", "f5523f0", "feat: motion explainer video for Hai Pantai", 0, "film"],
  ].map(([w, hash, msg, pr, film]) => ({ sec: hms(w), wita: w, hash, msg, pr, film: !!film }));
  const START = COMMITS[0].sec;           // 15:14:41, the first line of code
  const FILM = COMMITS.find((c) => c.hash === "e52f791").sec;

  // Build clock: film time -> seconds after 15:00 WITA (piecewise linear).
  const CLOCK = [[S.master, START], [S.swarm, 1063], [S.agents, 1321], [S.humans, 2694], [S.github, 3418], [S.film, 4176], [26.6, 4500]];
  function clockAt(t) {
    if (t <= CLOCK[0][0]) return CLOCK[0][1];
    for (let i = 1; i < CLOCK.length; i++) {
      const [t1, c1] = CLOCK[i], [t0, c0] = CLOCK[i - 1];
      if (t <= t1) return c0 + (c1 - c0) * (t - t0) / (t1 - t0);
    }
    return CLOCK[CLOCK.length - 1][1];
  }
  function timeAtClock(c) {
    for (let i = 1; i < CLOCK.length; i++) {
      const [t1, c1] = CLOCK[i], [t0, c0] = CLOCK[i - 1];
      if (c <= c1) return t0 + (t1 - t0) * (c - c0) / (c1 - c0);
    }
    return CLOCK[CLOCK.length - 1][0];
  }
  for (const c of COMMITS) c.t = +timeAtClock(c.sec).toFixed(3);

  // Sound cues [time, kind, gain]. Scene cues are written in each scene's local time.
  const L = (name, list) => list.map(([u, k, g]) => [at(name, u), k, g]);
  const CUES = [
    // hook (film time)
    [0.1, "thud", 1], [0.5, "thud", 1], [0.9, "thud", 1.05], [1.3, "snap", 0.9], [1.62, "thud", 0.6],
    [2.0, "tick", 1], [2.25, "tick", 0.8], [2.5, "tick", 1], [2.75, "tick", 0.8],
    [1.5, "riser", 1], [S.product, "impact", 1], [S.product + 0.05, "shimmer", 0.8],
    ...L("product", [[0.55, "sparkle", 0.8], [0.95, "ding", 0.6], [1.45, "whoosh", 0.8],
      [1.85, "scan", 1], [2.5, "pop", 1], [2.6, "pop", 1], [2.7, "pop", 1], [2.82, "pop", 0.8], [2.92, "pop", 0.8],
      [3.05, "tap", 1], [3.12, "ding", 1], [3.3, "swipe", 0.8], [3.6, "swipe", 1], [3.95, "count", 0.9], [4.4, "ding", 1],
      [4.8, "whooshSoft", 0.8], [5.05, "pop", 0.8], [5.3, "pop", 0.8], [5.5, "sparkle", 1], [5.6, "ding", 0.7], [5.72, "glitch", 1]]),
    [S.rewind, "tapestop", 1],
    ...L("rewind", [[0.55, "rewind", 1], [1.35, "blip", 1]]),
    [S.master, "thud", 0.9],
    ...L("master", [[0.3, "type", 0.8], [0.85, "type", 0.8], ...[...Array(11)].map((_, i) => [1.3 + i * 0.055, "blip", 0.5])]),
    [S.swarm, "impact", 0.8],
    ...L("swarm", [[4.15, "whoosh", 0.9], ...[...Array(8)].map((_, i) => [0.25 + i * 0.06, "pop", 0.7]), ...[...Array(24)].map((_, i) => [0.85 + i * 0.075, "pip", 0.5 + (i % 3) * 0.12])]),
    [S.agents, "thud", 0.8],
    ...L("agents", [[0.35, "scan", 0.9], [0.5, "scan", 0.7], [1.05, "pop", 0.8], [1.2, "pop", 0.8], [1.35, "pop", 0.8], [2.4, "ding", 0.8], [2.6, "ding", 0.6]]),
    [S.humans - 0.3, "whooshSoft", 0.8],
    ...L("humans", [[0.25, "type", 0.9], [1.0, "snap", 1], [1.15, "sparkle", 1], [1.3, "ding", 0.6],
      [1.6, "pop", 0.9], [1.8, "pop", 0.9], [2.0, "pop", 0.9], [2.2, "pop", 0.9],
      [2.45, "drop", 1], [2.6, "drop", 1], [2.75, "drop", 1], [2.9, "drop", 1]]),
    [S.github - 0.3, "whooshSoft", 0.7], [S.github, "thud", 0.8],
    // film
    [S.film - 0.2, "whoosh", 0.8], [S.film, "thud", 0.8],
    ...L("film", [...[...Array(11)].map((_, i) => [0.35 + i * 0.09, "pip", 0.8]), [0.4, "scan", 0.6]]),
    // finale
    [25.9, "riser", 1.1], [S.finale, "impact", 1.1], [S.finale + 0.05, "shimmer", 1], [28.2, "ding", 0.8], [28.7, "sparkle", 0.9],
  ];
  // every commit that lands on screen (the ticker and the GitHub feed)
  for (const c of COMMITS) if (c.t > S.master + 0.2 && c.t < S.finale) CUES.push([c.t, c.pr ? "merge" : c.film ? "ding" : "commit", c.t >= S.github ? 0.9 : 0.6]);
  CUES.sort((a, b) => a[0] - b[0]);

  const TL = { BEAT, BAR, S, SEG, segOf, at, DURATION, COMMITS, START, FILM, CLOCK, clockAt, timeAtClock, CUES };
  if (typeof module !== "undefined") module.exports = TL; else root.TL = TL;
})(typeof window !== "undefined" ? window : globalThis);
