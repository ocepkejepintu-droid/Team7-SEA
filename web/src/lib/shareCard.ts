import { beachMood, type BeachCard, type CardData, type CleanupCard, type PlayerCard } from "./share";
import { api } from "./api";

/**
 * Instagram story cards: 1080 x 1920 PNG.
 * Instagram covers about 250 px at the top and bottom with its own UI, so key content stays between y 220 and 1700.
 */
export const W = 1080;
export const H = 1920;

const C = {
  ink: "#12343b", brand: "#0e9f9a", brandInk: "#0b6b68", brandSoft: "#e6f5f4", sea: "#cfe9ea",
  sand: "#fbf6ec", sandDeep: "#f3ecdd", border: "#eadfc8", coral: "#ff6b4a", coralInk: "#b83a1e",
  amber: "#f59e0b", amberSoft: "#fef3c7", good: "#22c55e", goodInk: "#15803d", white: "#ffffff", muted: "#5d7377",
};
const FONT = `"Nunito Variable", ui-rounded, system-ui, sans-serif`;
const EMOJI = `"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
const font = (weight: number, size: number) => `${weight} ${size}px ${FONT}`;

type Ctx = CanvasRenderingContext2D;

export async function renderCard(data: CardData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  await Promise.all([400, 700, 800, 900].map((w) => document.fonts?.load(font(w, 40)).catch(() => undefined)));
  if (data.kind === "cleanup") await drawCleanup(ctx, data);
  else if (data.kind === "player") drawPlayer(ctx, data);
  else drawBeach(ctx, data);
  return new Promise((ok, bad) => canvas.toBlob((b) => (b ? ok(b) : bad(new Error("Could not make the image"))), "image/png"));
}

/* ---------- concept 1: before / after cleanup ---------- */

async function drawCleanup(ctx: Ctx, d: CleanupCard) {
  const [before, after] = await Promise.all([loadImage(api.photoUrl(d.before)), loadImage(api.photoUrl(d.after))]);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, C.brandInk); g.addColorStop(1, C.ink);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  waves(ctx, "rgba(255,255,255,0.06)", 1500, 6);

  lockup(ctx, 220, "rgba(255,255,255,0.75)");
  ctx.textAlign = "center";
  ctx.fillStyle = C.sea; ctx.font = font(800, 46);
  ctx.fillText("I CLEANED UP", W / 2, 330);
  ctx.fillStyle = C.white;
  fitText(ctx, d.beach, W / 2, 440, 900, 112, 900);

  polaroid(ctx, before, 120, 500, 840, 440, -2.2, "BEFORE", C.coral);
  polaroid(ctx, after, 120, 990, 840, 440, 1.8, "AFTER", C.good);
  stamp(ctx, 880, 1000, d.score);

  ctx.textAlign = "center";
  ctx.fillStyle = C.amber; ctx.font = font(900, 150);
  ctx.fillText(`+${d.points}`, W / 2, 1640);
  ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = font(800, 40);
  ctx.fillText(`points for ${d.avatar} ${d.cleaner}${d.verified ? " · checked by Claude" : ""}`, W / 2, 1705);
  footer(ctx, "Report trash. Clean it up. Win the week.", "rgba(255,255,255,0.6)");
}

function polaroid(ctx: Ctx, img: HTMLImageElement | null, x: number, y: number, w: number, h: number, deg: number, label: string, color: string) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
  ctx.fillStyle = C.white;
  rr(ctx, -w / 2 - 18, -h / 2 - 18, w + 36, h + 36, 28); ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.save();
  rr(ctx, -w / 2, -h / 2, w, h, 16); ctx.clip();
  if (img) cover(ctx, img, -w / 2, -h / 2, w, h);
  else { ctx.fillStyle = C.sandDeep; ctx.fillRect(-w / 2, -h / 2, w, h); }
  ctx.restore();
  ctx.font = font(900, 34);
  const tw = ctx.measureText(label).width + 48;
  ctx.fillStyle = color;
  rr(ctx, -w / 2 + 24, -h / 2 + 24, tw, 60, 30); ctx.fill();
  ctx.fillStyle = C.white; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(label, -w / 2 + 48, -h / 2 + 56);
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

function stamp(ctx: Ctx, cx: number, cy: number, score: number) {
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(0.2);
  ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  ctx.fillStyle = C.amber;
  burst(ctx, 0, 0, 120, 104, 14); ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = C.ink; ctx.textAlign = "center";
  ctx.font = font(900, 76); ctx.fillText(String(score), 0, 12);
  ctx.font = font(900, 24); ctx.fillText("CLEAN SCORE", 0, 50);
  ctx.restore();
}

/* ---------- concept 2: player trading card ---------- */

function drawPlayer(ctx: Ctx, d: PlayerCard) {
  ctx.fillStyle = C.sand; ctx.fillRect(0, 0, W, H);
  confetti(ctx);
  lockup(ctx, 220, C.brandInk);

  const x = 90, y = 290, w = 900, h = 1330;
  ctx.save();
  ctx.shadowColor = "rgba(18,52,59,0.22)"; ctx.shadowBlur = 60; ctx.shadowOffsetY = 24;
  ctx.fillStyle = C.white; rr(ctx, x, y, w, h, 64); ctx.fill();
  ctx.restore();

  // header band with a foil sheen
  ctx.save();
  rr(ctx, x, y, w, h, 64); ctx.clip();
  const band = ctx.createLinearGradient(x, y, x + w, y + 520);
  band.addColorStop(0, C.brand); band.addColorStop(0.55, C.brandInk); band.addColorStop(1, C.ink);
  ctx.fillStyle = band; ctx.fillRect(x, y, w, 520);
  const sheen = ctx.createLinearGradient(x, y, x + w, y + 520);
  sheen.addColorStop(0.3, "rgba(255,255,255,0)"); sheen.addColorStop(0.45, "rgba(255,255,255,0.18)"); sheen.addColorStop(0.6, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen; ctx.fillRect(x, y, w, 520);
  waves(ctx, "rgba(255,255,255,0.1)", y + 380, 3);
  ctx.restore();

  ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = font(900, 30);
  ctx.fillText("BEACH GUARDIAN", x + 56, y + 80);
  ctx.textAlign = "right";
  ctx.fillText(d.rank ? `#${d.rank} OF ${d.players}` : "ROOKIE", x + w - 56, y + 80);

  // avatar medallion
  ctx.fillStyle = C.white;
  circle(ctx, W / 2, y + 290, 150); ctx.fill();
  ctx.fillStyle = C.brandSoft;
  circle(ctx, W / 2, y + 290, 132); ctx.fill();
  emoji(ctx, d.avatar, W / 2, y + 290, 170);

  ctx.textAlign = "center"; ctx.fillStyle = C.ink;
  fitText(ctx, d.nickname, W / 2, y + 625, w - 120, 92, 900);
  ctx.fillStyle = C.brand; ctx.font = font(900, 190);
  ctx.fillText(d.points.toLocaleString("en-US"), W / 2, y + 810);
  ctx.fillStyle = C.muted; ctx.font = font(800, 40);
  ctx.fillText("points this season", W / 2, y + 862);

  // stats
  const stats: [number, string][] = [[d.reports, "reports"], [d.cleaned, "cleaned"], [d.badges.filter((b) => b.earned).length, "badges"]];
  const sw = (w - 112 - 40) / 3;
  stats.forEach(([v, l], i) => {
    const sx = x + 56 + i * (sw + 20);
    ctx.fillStyle = C.sand; rr(ctx, sx, y + 910, sw, 170, 32); ctx.fill();
    ctx.fillStyle = C.ink; ctx.font = font(900, 76); ctx.textAlign = "center";
    ctx.fillText(String(v), sx + sw / 2, y + 1000);
    ctx.fillStyle = C.muted; ctx.font = font(800, 32);
    ctx.fillText(l, sx + sw / 2, y + 1048);
  });

  // badges
  const n = d.badges.length;
  const gap = (w - 112) / n;
  d.badges.forEach((b, i) => {
    const bx = x + 56 + gap * i + gap / 2;
    const by = y + 1200;
    ctx.fillStyle = b.earned ? C.amberSoft : C.sandDeep;
    circle(ctx, bx, by, 58); ctx.fill();
    if (b.earned) { ctx.strokeStyle = C.amber; ctx.lineWidth = 5; circle(ctx, bx, by, 58); ctx.stroke(); }
    ctx.globalAlpha = b.earned ? 1 : 0.25;
    emoji(ctx, b.emoji, bx, by, 56);
    ctx.globalAlpha = 1;
  });

  ctx.textAlign = "center"; ctx.fillStyle = C.brandInk; ctx.font = font(900, 46);
  ctx.fillText("Think you can beat me? 🌊", W / 2, 1700);
  footer(ctx, "Report trash. Clean it up. Win the week.", C.muted);
}

/* ---------- concept 3: beach health poster ---------- */

function drawBeach(ctx: Ctx, d: BeachCard) {
  const mood = beachMood(d);
  const [top, bottom, accent] = mood.tone === "win" ? [C.brand, C.brandInk, C.amber]
    : mood.tone === "help" ? [C.coral, C.coralInk, C.white] : ["#1aa7a1", C.ink, C.sea];
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  sun(ctx, 900, 330, 260, "rgba(255,255,255,0.08)");
  waves(ctx, "rgba(255,255,255,0.08)", 1560, 5);

  lockup(ctx, 220, "rgba(255,255,255,0.8)");
  ctx.textAlign = "center";
  ctx.fillStyle = accent; ctx.font = font(900, 44);
  ctx.fillText((mood.tone === "win" ? "🏆 " : mood.tone === "help" ? "🆘 " : "📈 ") + mood.kicker.toUpperCase(), W / 2, 340);
  ctx.fillStyle = C.white;
  fitText(ctx, d.beach, W / 2, 470, 940, 130, 900);

  // health ring
  const cx = W / 2, cy = 860, r = 270;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 48;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = accent;
  ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * Math.max(2, d.health)) / 100); ctx.stroke();
  ctx.fillStyle = C.white; ctx.font = font(900, 250);
  ctx.fillText(String(d.health), cx, cy + 70);
  ctx.font = font(900, 44); ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("BEACH HEALTH", cx, cy + 140);

  // chips
  const chips = [d.rank ? `#${d.rank} of ${d.ranked}` : "Unranked", `${d.open} open`, `${d.cleanedThisWeek} cleaned`];
  ctx.font = font(900, 40);
  const widths = chips.map((t) => ctx.measureText(t).width + 64);
  let cxp = (W - widths.reduce((a, b) => a + b, 0) - 24 * (chips.length - 1)) / 2;
  chips.forEach((t, i) => {
    ctx.fillStyle = "rgba(255,255,255,0.18)"; rr(ctx, cxp, 1230, widths[i], 84, 42); ctx.fill();
    ctx.fillStyle = C.white; ctx.textBaseline = "middle"; ctx.fillText(t, cxp + widths[i] / 2, 1274);
    ctx.textBaseline = "alphabetic";
    cxp += widths[i] + 24;
  });

  // weekly challenge
  const pct = d.challenge.goal > 0 ? Math.min(1, d.challenge.done / d.challenge.goal) : 0;
  ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = font(900, 34);
  ctx.fillText("BALI WEEKLY CHALLENGE", 120, 1420);
  ctx.textAlign = "right"; ctx.fillText(`${d.challenge.done} / ${d.challenge.goal} spots`, W - 120, 1420);
  ctx.fillStyle = "rgba(255,255,255,0.22)"; rr(ctx, 120, 1450, W - 240, 36, 18); ctx.fill();
  ctx.fillStyle = C.white; rr(ctx, 120, 1450, Math.max(36, (W - 240) * pct), 36, 18); ctx.fill();

  ctx.textAlign = "center"; ctx.fillStyle = C.white; ctx.font = font(900, 54);
  fitText(ctx, mood.cta + " 🧹", W / 2, 1640, 940, 54, 900);
  footer(ctx, "Report trash. Clean it up. Win the week.", "rgba(255,255,255,0.65)");
}

/* ---------- shared pieces ---------- */

function lockup(ctx: Ctx, y: number, color: string) {
  ctx.textAlign = "center"; ctx.fillStyle = color; ctx.font = font(900, 38);
  ctx.save();
  if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = "6px";
  ctx.fillText("🌊 HAI PANTAI · BALI", W / 2, y);
  ctx.restore();
}

function footer(ctx: Ctx, text: string, color: string) {
  ctx.textAlign = "center"; ctx.fillStyle = color; ctx.font = font(800, 32);
  ctx.fillText(text, W / 2, 1770);
}

/** Draw text centred at x, shrinking the font until it fits maxW. */
function fitText(ctx: Ctx, text: string, x: number, y: number, maxW: number, size: number, weight: number) {
  let s = size;
  ctx.font = font(weight, s);
  while (s > 28 && ctx.measureText(text).width > maxW) { s -= 4; ctx.font = font(weight, s); }
  let t = text;
  while (t.length > 1 && ctx.measureText(t).width > maxW) t = t.slice(0, -2) + "…";
  ctx.fillText(t, x, y);
}

function emoji(ctx: Ctx, e: string, x: number, y: number, size: number) {
  ctx.save();
  ctx.font = `${size}px ${EMOJI}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(e, x, y + size * 0.05);
  ctx.restore();
}

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(ctx: Ctx, x: number, y: number, r: number) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }

function burst(ctx: Ctx, x: number, y: number, outer: number, inner: number, points: number) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (Math.PI * i) / points;
    const r = i % 2 ? inner : outer;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}

function waves(ctx: Ctx, color: string, y0: number, rows: number) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 10; ctx.lineCap = "round";
  for (let i = 0; i < rows; i++) {
    const y = y0 + i * 70;
    ctx.beginPath();
    for (let x = -40; x <= W + 40; x += 10) ctx.lineTo(x, y + Math.sin((x + i * 60) / 70) * 14);
    ctx.stroke();
  }
  ctx.restore();
}

function sun(ctx: Ctx, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  for (let i = 0; i < 3; i++) { circle(ctx, x, y, r - i * 70); ctx.fill(); }
}

function confetti(ctx: Ctx) {
  const colors = [C.brand, C.coral, C.amber, C.sea];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 400; i++) {
    const x = rnd() * W, y = rnd() * H, r = 6 + rnd() * 14;
    // keep clear of the lockup, the card and the footer text
    if (x > 60 && x < W - 60 && y > 150 && y < 1820) continue;
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.35;
    circle(ctx, x, y, r); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function cover(ctx: Ctx, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const iw = img.naturalWidth || w, ih = img.naturalHeight || h;
  const s = Math.max(w / iw, h / ih);
  const dw = iw * s, dh = ih * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((ok) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });
}

/** Share the PNG with the system share sheet (Instagram Stories on phones), or download it. */
export async function sharePng(blob: Blob, filename: string, text: string): Promise<"shared" | "saved" | "cancelled"> {
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], text }); return "shared"; }
    catch (e) { if ((e as Error).name === "AbortError") return "cancelled"; }
  }
  savePng(blob, filename);
  return "saved";
}

export function savePng(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
