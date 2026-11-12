// "Built in one hour": scene times, the build clock and every sound cue.
// The page and the soundtrack (audio.mjs) both read this file, so they stay in sync.
// 120 BPM: a beat is 0.5 s and a bar is 2 s. The film is 30 s (15 bars).
(function (root) {
  const BEAT = 0.5, BAR = 2, DURATION = 30;
  const S = { hook: 0, product: 3, rewind: 9, master: 10.5, swarm: 13, agents: 17.5, humans: 21, github: 24.5, finale: 27.5, end: 30 };

  // Real commits from the build hour (git log, times in WITA = UTC+8), as seconds after 15:00:00.
  // [sec, hash, message, pr]
  const hms = (s) => { const [h, m, x] = s.split(":").map(Number); return (h - 15) * 3600 + m * 60 + x; };
  const COMMITS = [
    ["15:10:07", "c5cd57f", "docs: design spec and implementation plan"],
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
  ].map(([w, hash, msg, pr]) => ({ sec: hms(w), wita: w, hash, msg, pr }));

  // Build clock: film time -> seconds after 15:00 WITA (piecewise linear).
  const CLOCK = [[S.master, 607], [S.swarm, 881], [S.agents, 1321], [S.humans, 2694], [S.github, 3418], [27.3, 4176]];
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

  // Sound cues [time, kind, gain]
  const CUES = [
    // hook
    [0.1, "thud", 1], [0.6, "thud", 1], [1.1, "thud", 1.1], [1.6, "snap", 0.9],
    [2.0, "tick", 1], [2.25, "tick", 0.8], [2.5, "tick", 1], [2.75, "tick", 0.8],
    [1.5, "riser", 1], [S.product, "impact", 1], [S.product + 0.05, "shimmer", 0.8],
    // product
    [3.55, "sparkle", 0.8], [3.95, "ding", 0.6], [4.45, "whoosh", 0.8],
    [4.85, "scan", 1], [5.5, "pop", 1], [5.6, "pop", 1], [5.7, "pop", 1], [5.82, "pop", 0.8], [5.92, "pop", 0.8],
    [6.05, "tap", 1], [6.12, "ding", 1], [6.3, "swipe", 0.8], [6.6, "swipe", 1], [6.95, "count", 0.9], [7.4, "ding", 1],
    [7.8, "whooshSoft", 0.8], [8.05, "pop", 0.8], [8.3, "pop", 0.8], [8.5, "sparkle", 1], [8.6, "ding", 0.7],
    [8.72, "glitch", 1],
    // rewind
    [S.rewind, "tapestop", 1], [9.55, "rewind", 1], [10.35, "blip", 1],
    // master
    [S.master, "thud", 0.9], [10.8, "type", 0.8], [11.35, "type", 0.8],
    // swarm
    [S.swarm, "impact", 0.8], [17.15, "whoosh", 0.9],
    // agents
    [S.agents, "thud", 0.8], [17.85, "scan", 0.9], [18.0, "scan", 0.7], [19.9, "ding", 0.8], [20.1, "ding", 0.6], [20.75, "whooshSoft", 0.8],
    // humans
    [21.25, "type", 0.9], [22.0, "snap", 1], [22.15, "sparkle", 1], [22.3, "ding", 0.6],
    [22.6, "pop", 0.9], [22.8, "pop", 0.9], [23.0, "pop", 0.9], [23.2, "pop", 0.9],
    [23.45, "drop", 1], [23.6, "drop", 1], [23.75, "drop", 1], [23.9, "drop", 1], [24.2, "whooshSoft", 0.7],
    // github
    [S.github, "thud", 0.8],
    // finale
    [25.9, "riser", 1.1], [S.finale, "impact", 1.1], [S.finale + 0.05, "shimmer", 1], [28.2, "ding", 0.8], [28.7, "sparkle", 0.9],
  ];
  // plan rows dispatched in the master scene
  for (let i = 0; i < 10; i++) CUES.push([+(11.8 + i * 0.075).toFixed(3), "blip", 0.5]);
  // lanes and leaves spawning in the swarm
  for (let i = 0; i < 8; i++) CUES.push([+(13.25 + i * 0.06).toFixed(3), "pop", 0.7]);
  for (let i = 0; i < 24; i++) CUES.push([+(13.85 + i * 0.075).toFixed(3), "pip", 0.5 + (i % 3) * 0.12]);
  // agent detections
  [18.55, 18.7, 18.85].forEach((t) => CUES.push([t, "pop", 0.8]));
  // every commit that lands on screen (the ticker and the GitHub feed)
  for (const c of COMMITS) if (c.t > S.master + 0.2 && c.t < S.finale) CUES.push([c.t, c.pr ? "merge" : "commit", c.t >= S.github ? 0.9 : 0.6]);
  CUES.sort((a, b) => a[0] - b[0]);

  const TL = { BEAT, BAR, S, DURATION, COMMITS, CLOCK, clockAt, timeAtClock, CUES };
  if (typeof module !== "undefined") module.exports = TL; else root.TL = TL;
})(typeof window !== "undefined" ? window : globalThis);
