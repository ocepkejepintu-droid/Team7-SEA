// Renders src/index.html (or src/short.html with --short) frame by frame and encodes the film to out/
// Usage: node render.mjs [--fps 60] [--workers 3] [--from 0 --to 103.2]
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const SHORT = process.argv.includes("--short");
const TL = createRequire(import.meta.url)(SHORT ? "./src/short-timeline.js" : "./src/timeline.js");
const FPS = +arg("fps", 60), WORKERS = +arg("workers", 3);
const FROM = +arg("from", 0), TO = +arg("to", TL.DURATION);
const OUT = join(here, "out"), SEG = join(OUT, "seg");
mkdirSync(SEG, { recursive: true });
const total = Math.round((TO - FROM) * FPS);
const per = Math.ceil(total / WORKERS);
const url = pathToFileURL(join(here, SHORT ? "src/short.html" : "src/index.html")).href;

const run = (cmd, args, opts = {}) => new Promise((res, rej) => {
  const p = spawn(cmd, args, { stdio: ["pipe", "inherit", "inherit"], ...opts });
  p.on("exit", (c) => (c === 0 ? res() : rej(new Error(cmd + " exited " + c))));
  return p;
});

const started = Date.now();
let done = 0;
const browser = await chromium.launch({ args: ["--disable-gpu-vsync", "--disable-frame-rate-limit"] });
async function worker(w) {
  const a = w * per, b = Math.min(total, a + per);
  if (a >= b) return null;
  const file = join(SEG, `seg${w}.mp4`);
  const ff = spawn("ffmpeg", ["-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-tune", "animation", "-r", String(FPS), file], { stdio: ["pipe", "inherit", "inherit"] });
  const ffDone = new Promise((res, rej) => ff.on("exit", (c) => (c === 0 ? res() : rej(new Error("ffmpeg " + c)))));
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on("pageerror", (e) => console.error("page error", e));
  await page.goto(url);
  await page.evaluate(() => window.ready);
  for (let f = a; f < b; f++) {
    const t = FROM + f / FPS;
    await page.evaluate((t) => window.renderFrame(t), t);
    const jpg = await page.screenshot({ type: "jpeg", quality: 95 });
    if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once("drain", r));
    if (++done % 120 === 0) {
      const el = (Date.now() - started) / 1000;
      process.stdout.write(`\r${done}/${total} frames  ${(done / el).toFixed(1)} fps  eta ${Math.round((total - done) / (done / el))}s   `);
    }
  }
  ff.stdin.end();
  await page.close();
  await ffDone;
  return file;
}
const segs = (await Promise.all([...Array(WORKERS)].map((_, w) => worker(w)))).filter(Boolean);
await browser.close();
console.log(`\nframes done in ${Math.round((Date.now() - started) / 1000)}s`);

writeFileSync(join(SEG, "list.txt"), segs.map((s) => `file '${s}'`).join("\n"));
const wav = join(OUT, SHORT ? "soundtrack-30s.wav" : "soundtrack.wav");
if (!existsSync(wav)) await run("node", [join(here, "audio.mjs"), ...(SHORT ? ["--short"] : [])]);
const final = join(OUT, FROM === 0 && TO === TL.DURATION ? (SHORT ? "hai-pantai-30s.mp4" : "hai-pantai-launch.mp4") : `preview-${FROM}-${TO}.mp4`);
await run("ffmpeg", ["-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", join(SEG, "list.txt"),
  "-ss", String(FROM), "-t", String(TO - FROM), "-i", wav,
  "-map", "0:v", "-map", "1:a", "-c:v", "copy",
  "-af", "loudnorm=I=-14:TP=-1.0:LRA=11", "-ar", "48000", "-c:a", "aac", "-b:a", "256k",
  "-movflags", "+faststart", "-shortest", final]);
console.log("wrote", final);
