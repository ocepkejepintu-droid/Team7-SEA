// Saves stills of the film for review: node snap.mjs <outdir> 1.5 4 9.2 ...
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const { chromium } = createRequire(import.meta.url)("playwright");
const here = dirname(fileURLToPath(import.meta.url));
const [dir, ...times] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on("pageerror", (e) => console.error("page error", e.message));
page.on("console", (m) => { if (m.type() === "error") console.error("console", m.text()); });
await page.goto(pathToFileURL(join(here, "src/index.html")).href);
await page.evaluate(() => window.ready);
for (const t of times) {
  await page.evaluate((t) => window.renderFrame(t), +t);
  await page.screenshot({ path: join(dir, `t${(+t).toFixed(2)}.png`) });
}
await browser.close();
