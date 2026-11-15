// Renders video/src/index.html frame by frame and pipes the frames to ffmpeg.
//   node video/scripts/render.cjs                      full video -> video/out/hai-pantai-explainer.mp4
//   node video/scripts/render.cjs --stills 1,7.5,20    PNG stills -> video/out/stills/
//   node video/scripts/render.cjs --from 14 --to 26    render a part (no audio)
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const root = path.resolve(__dirname, "..");
const FPS = Number(arg("fps", 30));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: Number(arg("scale", 1)) });
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto("file://" + path.join(root, "src/index.html"));
  await page.evaluate(() => window.ready);
  const dur = await page.evaluate(() => window.DURATION);

  const stills = arg("stills");
  if (stills) {
    const dir = path.resolve(arg("dir", path.join(root, "out/stills")));
    fs.mkdirSync(dir, { recursive: true });
    for (const t of stills.split(",").map(Number)) {
      await page.evaluate((t) => window.renderFrame(t), t);
      await page.screenshot({ path: path.join(dir, `t${t.toFixed(2).padStart(6, "0")}.png`) });
    }
    await browser.close();
    return;
  }

  const from = Number(arg("from", 0)), to = Number(arg("to", dur));
  const audio = path.join(root, "out/music.wav");
  const out = arg("out", path.join(root, from === 0 && to === dur ? "out/hai-pantai-explainer.mp4" : "out/part.mp4"));
  const withAudio = from === 0 && fs.existsSync(audio);
  const ff = spawn("ffmpeg", [
    "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    ...(withAudio ? ["-i", audio, "-af", "loudnorm=I=-15:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-shortest"] : []),
    "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out,
  ], { stdio: ["pipe", "inherit", "inherit"] });

  const n = Math.round((to - from) * FPS);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const t = from + i / FPS;
    await page.evaluate((t) => window.renderFrame(t), t);
    const buf = await page.screenshot({ type: "jpeg", quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 150 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await browser.close();
  console.log("wrote", out);
})();
