// Screenshot chosen times for review: node snap.mjs out_dir t1 t2 ...
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { pathToFileURL } from "node:url";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const [out, ...ts] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: process.env.VERT ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 } });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await page.goto(pathToFileURL(join(here, process.env.PAGE || "src/index.html")).href);
await page.evaluate(() => window.ready);
for (const t of ts) {
  await page.evaluate((t) => window.renderFrame(t), +t);
  await page.screenshot({ path: join(out, `t${(+t).toFixed(2).padStart(6, "0")}.jpg`), type: "jpeg", quality: 80 });
}
if (errs.length) console.log("ERRORS:\n" + errs.join("\n"));
await browser.close();
