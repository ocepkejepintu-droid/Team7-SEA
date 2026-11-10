import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { GameState, Report, Size, TrashType } from "../../shared/types";
import { SIZES, TRASH_TYPES } from "../../shared/types";
import { beaches, snapToCoast } from "../../shared/coast";
import { CLEAN_PASS, badges, challenge, cleanPoints, isHotspot, league, playerPoints, reportPoints } from "../../shared/game";
import { compareCleanup, tagPhoto } from "./claude";
import { createStore, publicPlayer, type Store, type StoredPlayer } from "./store";

const MAX_BODY = 3 * 1024 * 1024;
const AI_LIMIT = 30;
const HOUR = 3600_000;

class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".woff2": "font/woff2", ".woff": "font/woff",
  ".ico": "image/x-icon", ".webp": "image/webp", ".txt": "text/plain; charset=utf-8", ".webmanifest": "application/manifest+json",
};

function scriptDir(): string {
  try { return path.dirname(fileURLToPath(import.meta.url)); } catch { return process.cwd(); }
}

function resolveWebDir(): string {
  if (process.env.WEB_DIR) return path.resolve(process.env.WEB_DIR);
  const here = scriptDir();
  const candidates = [path.resolve(here, "../../web/dist"), path.resolve(process.cwd(), "../web/dist"), path.resolve(process.cwd(), "web/dist")];
  return candidates.find((c) => fs.existsSync(path.join(c, "index.html"))) ?? candidates[0];
}

function json(res: ServerResponse, status: number, body: unknown) {
  const data = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "content-length": Buffer.byteLength(data) });
  res.end(data);
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers["content-length"] ?? 0);
    let size = 0; let tooBig = declared > MAX_BODY;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) tooBig = true;
      if (!tooBig) chunks.push(c);
      if (size > 40 * MAX_BODY) { req.destroy(); reject(new HttpError(413, "Photo too large")); }
    });
    req.on("end", () => {
      if (tooBig) return reject(new HttpError(413, "Photo too large"));
      if (size === 0) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } catch { reject(new HttpError(400, "Invalid JSON")); }
    });
    req.on("error", () => reject(new HttpError(400, "Bad request")));
  });
}

function decodePhoto(v: unknown): { b64: string; buf: Buffer } {
  if (typeof v !== "string" || !v) throw new HttpError(400, "Photo missing");
  const b64 = v.replace(/^data:[^;,]*;base64,/, "").replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/_-]+=*$/.test(b64)) throw new HttpError(400, "Photo is not valid base64");
  const buf = Buffer.from(b64, "base64");
  if (buf.length < 4) throw new HttpError(400, "Photo missing");
  return { b64, buf };
}

const newId = () => crypto.randomBytes(9).toString("base64url");

export function createApp(opts: { dataDir?: string; webDir?: string } = {}) {
  const store: Store = createStore(opts.dataDir ?? process.env.DATA_DIR ?? path.resolve("server/data"));
  const webDir = opts.webDir ?? resolveWebDir();
  const beachList = beaches.map((b) => ({ id: b.id, name: b.name }));
  const aiCalls = new Map<string, number[]>();
  const cleaning = new Set<string>();

  const auth = (req: IncomingMessage): StoredPlayer => {
    const t = req.headers["x-player-token"];
    const p = store.playerByToken(Array.isArray(t) ? t[0] : t);
    if (!p) throw new HttpError(401, "Join first");
    return p;
  };
  const useAi = (token: string) => {
    const now = Date.now();
    const list = (aiCalls.get(token) ?? []).filter((t) => now - t < HOUR);
    if (list.length >= AI_LIMIT) { aiCalls.set(token, list); throw new HttpError(429, "Slow down a little"); }
    list.push(now); aiCalls.set(token, list);
  };

  function state(req: IncomingMessage): GameState {
    const now = new Date();
    const reports = [...store.db.reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const players = store.db.players
      .map((p) => ({ id: p.id, nickname: p.nickname, avatar: p.avatar, points: playerPoints(reports, p.id) }))
      .sort((a, b) => b.points - a.points || a.nickname.localeCompare(b.nickname))
      .slice(0, 20);
    const out: GameState = { reports, league: league(reports, now, beachList), players, challenge: challenge(reports, now) };
    const t = req.headers["x-player-token"];
    const me = store.playerByToken(Array.isArray(t) ? t[0] : t);
    if (me) out.me = { player: publicPlayer(me), points: playerPoints(reports, me.id), badges: badges(reports, me.id) };
    return out;
  }

  async function api(req: IncomingMessage, res: ServerResponse, route: string) {
    const method = req.method ?? "GET";
    if (method === "GET" && route === "state") return json(res, 200, state(req));

    if (method === "GET" && route.startsWith("photos/")) {
      const file = decodeURIComponent(route.slice(7));
      if (!/^[A-Za-z0-9_-][A-Za-z0-9._-]*\.(jpg|jpeg|svg)$/.test(file) || file.includes("..")) throw new HttpError(404, "Not found");
      const full = path.join(store.photosDir, file);
      if (!full.startsWith(store.photosDir + path.sep) || !fs.existsSync(full)) throw new HttpError(404, "Not found");
      res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream", "cache-control": "public, max-age=31536000, immutable" });
      fs.createReadStream(full).pipe(res);
      return;
    }

    if (method !== "POST") throw new HttpError(404, "Not found");

    if (route === "players") {
      const body = (await readBody(req)) as { nickname?: unknown; avatar?: unknown };
      const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
      if ([...nickname].length < 2 || [...nickname].length > 20) throw new HttpError(400, "Nickname must be 2 to 20 characters");
      let avatar = typeof body.avatar === "string" ? body.avatar.trim() : "";
      if (avatar.length > 16) throw new HttpError(400, "Avatar too long");
      if (!avatar) avatar = "🐢";
      const p: StoredPlayer = { id: newId(), nickname, avatar, createdAt: new Date().toISOString(), token: crypto.randomBytes(24).toString("base64url") };
      store.db.players.push(p); store.save();
      return json(res, 200, { player: publicPlayer(p), token: p.token });
    }

    const player = auth(req);

    if (route === "ai/tag") {
      const body = (await readBody(req)) as { photo?: unknown };
      const { b64 } = decodePhoto(body.photo);
      useAi(player.token);
      const t = await tagPhoto(b64);
      return json(res, 200, t ? { ...t, ai: true } : { isTrash: true, type: "mixed", size: "M", summary: "", ai: false });
    }

    if (route === "reports") {
      const body = (await readBody(req)) as Record<string, unknown>;
      const lng = Number(body.lng), lat = Number(body.lat);
      if (typeof body.lng !== "number" || typeof body.lat !== "number" || !Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
        throw new HttpError(400, "Invalid location");
      if (!TRASH_TYPES.includes(body.type as TrashType)) throw new HttpError(400, "Invalid trash type");
      if (!SIZES.includes(body.size as Size)) throw new HttpError(400, "Invalid size");
      if (body.note !== undefined && body.note !== null && typeof body.note !== "string") throw new HttpError(400, "Invalid note");
      const { buf } = decodePhoto(body.photo);
      const snap = snapToCoast(lng, lat);
      const before = badges(store.db.reports, player.id);
      const id = newId();
      const photo = store.savePhoto(id, buf, "jpg");
      const size = body.size as Size;
      const note = typeof body.note === "string" ? body.note.trim().slice(0, 200) : "";
      const report: Report = {
        id, beachId: snap.beachId, lng: snap.lng, lat: snap.lat, type: body.type as TrashType, size,
        ...(note ? { note } : {}), photo, by: player.id, createdAt: new Date().toISOString(), status: "open", points: reportPoints(size),
      };
      store.db.reports.push(report); store.save();
      const after = badges(store.db.reports, player.id);
      return json(res, 200, { report, points: report.points, newBadges: after.filter((b) => !before.includes(b)) });
    }

    const m = route.match(/^reports\/([^/]+)\/clean$/);
    if (m) {
      const id = decodeURIComponent(m[1]);
      const body = (await readBody(req)) as { photo?: unknown };
      const report = store.db.reports.find((r) => r.id === id);
      if (!report) throw new HttpError(404, "Report not found");
      if (report.status !== "open" || cleaning.has(id)) throw new HttpError(409, "Already cleaned");
      const { b64, buf } = decodePhoto(body.photo);
      useAi(player.token);
      cleaning.add(id);
      try {
        let beforeB64: string | null = null;
        if (/\.jpe?g$/i.test(report.photo)) {
          try { beforeB64 = fs.readFileSync(path.join(store.photosDir, report.photo)).toString("base64"); } catch { beforeB64 = null; }
        }
        const verdict = await compareCleanup(beforeB64, b64);
        const score = verdict ? verdict.score : 70;
        const reason = verdict ? verdict.reason : "Not checked by Claude";
        const verified = !!verdict;
        if (report.status !== "open") throw new HttpError(409, "Already cleaned");
        if (score < CLEAN_PASS) return json(res, 200, { report, points: 0, score, reason, verified, newBadges: [] });
        const now = new Date();
        const before = badges(store.db.reports, player.id);
        const points = cleanPoints(report, score, now);
        const hotspot = isHotspot(report, now);
        const cleanPhoto = store.savePhoto(`${id}-clean`, buf, "jpg");
        report.status = "cleaned";
        report.clean = { by: player.id, photo: cleanPhoto, score, reason, verified, at: now.toISOString(), points, hotspot };
        store.save();
        const after = badges(store.db.reports, player.id);
        return json(res, 200, { report, points, score, reason, verified, newBadges: after.filter((b) => !before.includes(b)) });
      } finally {
        cleaning.delete(id);
      }
    }
    throw new HttpError(404, "Not found");
  }

  function serveStatic(req: IncomingMessage, res: ServerResponse, pathname: string) {
    if (req.method !== "GET" && req.method !== "HEAD") return json(res, 404, { error: "Not found" });
    const root = path.resolve(webDir);
    const tryFile = (p: string): string | null => {
      let rel: string;
      try { rel = decodeURIComponent(p); } catch { return null; }
      const full = path.resolve(root, "." + rel);
      if (full !== root && !full.startsWith(root + path.sep)) return null;
      try { return fs.statSync(full).isFile() ? full : null; } catch { return null; }
    };
    const stripped = pathname.replace(/^\/[^/]+(?=\/)/, "");
    let file = tryFile(pathname) ?? (stripped !== pathname ? tryFile(stripped) : null);
    let fallback = false;
    if (!file) { file = tryFile("/index.html"); fallback = true; }
    if (!file) return json(res, 404, { error: "Not found" });
    const ext = path.extname(file).toLowerCase();
    const immutable = !fallback && /[-.][A-Za-z0-9_]{8,}\.(js|css|woff2|png|jpg|svg)$/.test(file);
    res.writeHead(200, { "content-type": MIME[ext] ?? "application/octet-stream", "cache-control": ext === ".html" ? "no-cache" : immutable ? "public, max-age=31536000, immutable" : "public, max-age=3600" });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  }

  const handler = (req: IncomingMessage, res: ServerResponse) => {
    let pathname = "/";
    try { pathname = new URL(req.url ?? "/", "http://x").pathname; } catch { /* keep "/" */ }
    const i = pathname.indexOf("/api/");
    if (i < 0) { try { serveStatic(req, res, pathname); } catch { json(res, 500, { error: "Server error" }); } return; }
    const route = pathname.slice(i + 5).replace(/\/+$/, "");
    api(req, res, route).catch((e: unknown) => {
      req.resume();
      if (res.headersSent) { res.end(); return; }
      if (e instanceof HttpError) return json(res, e.status, { error: e.message });
      console.error(e);
      json(res, 500, { error: "Server error" });
    });
  };

  return { handler, store };
}
