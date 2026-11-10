import { afterAll, beforeAll, beforeEach, afterEach, expect, test } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { beachById } from "../../shared/coast";
import { startMock } from "./mock-anthropic";
import { startApp, tmpDir } from "./helpers";

let mock: Awaited<ReturnType<typeof startMock>>;
let app: Awaited<ReturnType<typeof startApp>>;
let dir: string;
const PHOTO = Buffer.from("\xff\xd8\xff\xe0fake-jpeg-bytes", "binary").toString("base64");
const kuta = beachById("kuta-badung")!;
const seaPin = { lng: kuta.center[0] - 0.01, lat: kuta.center[1] };

beforeAll(async () => { mock = await startMock(); process.env.ANTHROPIC_BASE_URL = mock.url; process.env.ANTHROPIC_API_KEY = "test-key"; });
afterAll(async () => { await mock.close(); });
beforeEach(async () => { dir = tmpDir(); app = await startApp(dir); });
afterEach(async () => { await app.close(); });

async function join(nickname = "Wayan") {
  const r = await app.call("api/players", { nickname, avatar: "🐢" });
  expect(r.status).toBe(200);
  return r.data.token as string;
}
async function report(token: string, size = "M") {
  return app.call("api/reports", { ...seaPin, photo: PHOTO, type: "plastic", size }, token);
}

test("join then report earns 20 points for M on the snapped beach", async () => {
  const j = await app.call("api/players", { nickname: "  Wayan  ", avatar: "🐢" });
  expect(j.data.player.nickname).toBe("Wayan");
  expect(j.data.player.token).toBeUndefined();
  const r = await report(j.data.token);
  expect(r.status).toBe(200);
  expect(r.data.points).toBe(20);
  expect(r.data.report.beachId).toBe("kuta-badung");
  expect(r.data.report.lng).not.toBe(seaPin.lng);
  expect(r.data.newBadges).toEqual(["first_report"]);
  expect(fs.existsSync(path.join(dir, "photos", r.data.report.photo))).toBe(true);
  const photo = await fetch(`${app.base}/api/photos/${r.data.report.photo}`);
  expect(photo.headers.get("content-type")).toBe("image/jpeg");
  const s = await app.call("api/state", undefined, j.data.token);
  expect(s.data.me.points).toBe(20);
  expect(s.data.players[0]).toEqual({ id: j.data.player.id, nickname: "Wayan", avatar: "🐢", points: 20 });
  expect(JSON.stringify(s.data)).not.toContain(j.data.token);
});

test("bad input is 400", async () => {
  expect((await app.call("api/players", { nickname: "W", avatar: "🐢" })).status).toBe(400);
  const t = await join();
  expect((await app.call("api/reports", { ...seaPin, photo: PHOTO, type: "gold", size: "M" }, t)).status).toBe(400);
  expect((await app.call("api/reports", { lng: "x", lat: 1, photo: PHOTO, type: "plastic", size: "M" }, t)).status).toBe(400);
  expect((await app.call("api/reports", { ...seaPin, photo: PHOTO, type: "plastic", size: "XL" }, t)).status).toBe(400);
});

test("tag uses Claude and falls back when it fails", async () => {
  const t = await join();
  mock.tag({ is_trash: true, type: "bottles", size: "l", summary: "Two bottles" });
  const a = await app.call("api/ai/tag", { photo: PHOTO }, t);
  expect(a.data).toEqual({ isTrash: true, type: "bottles", size: "L", summary: "Two bottles", ai: true });
  const call = mock.calls.at(-1)!;
  expect(call.headers["x-api-key"]).toBe("test-key");
  expect(call.headers["anthropic-version"]).toBe("2023-06-01");
  expect(call.body.content ?? call.body.messages[0].content[0].source.data).toBeTruthy();
  mock.tag({ is_trash: true, type: "weird", size: "huge" });
  expect((await app.call("api/ai/tag", { photo: PHOTO }, t)).data).toMatchObject({ type: "mixed", size: "M", ai: true });
  mock.fail();
  expect((await app.call("api/ai/tag", { photo: PHOTO }, t)).data).toEqual({ isTrash: true, type: "mixed", size: "M", summary: "", ai: false });
});

test("clean with mock score 90 marks cleaned and returns points", async () => {
  const a = await join("Wayan"); const b = await join("Komang");
  const r = await report(a, "M");
  mock.clean(90, "All gone");
  const c = await app.call(`api/reports/${r.data.report.id}/clean`, { photo: PHOTO }, b);
  expect(c.status).toBe(200);
  expect(c.data).toMatchObject({ score: 90, reason: "All gone", verified: true, points: 54 });
  expect(c.data.report.status).toBe("cleaned");
  expect(c.data.report.clean).toMatchObject({ score: 90, verified: true, points: 54, hotspot: false });
  expect(c.data.newBadges).toEqual(["first_clean"]);
  const body = mock.calls.at(-1)!.body;
  expect(body.model).toBe("claude-sonnet-5-5");
  expect(body.messages[0].content.filter((x: any) => x.type === "image")).toHaveLength(2);
});

test("low clean score leaves the report open with 0 points", async () => {
  const a = await join();
  const r = await report(a, "S");
  mock.clean(20, "Still trash");
  const c = await app.call(`api/reports/${r.data.report.id}/clean`, { photo: PHOTO }, a);
  expect(c.status).toBe(200);
  expect(c.data).toMatchObject({ points: 0, score: 20, reason: "Still trash" });
  expect(c.data.report.status).toBe("open");
});

test("second clean of the same report is 409", async () => {
  const a = await join();
  const r = await report(a, "M");
  mock.clean(80);
  const [x, y] = await Promise.all([
    app.call(`api/reports/${r.data.report.id}/clean`, { photo: PHOTO }, a),
    app.call(`api/reports/${r.data.report.id}/clean`, { photo: PHOTO }, a),
  ]);
  expect([x.status, y.status].sort()).toEqual([200, 409]);
  const z = await app.call(`api/reports/${r.data.report.id}/clean`, { photo: PHOTO }, a);
  expect(z.status).toBe(409);
  expect(z.data).toEqual({ error: "Already cleaned" });
  expect((await app.call(`api/reports/nope/clean`, { photo: PHOTO }, a)).status).toBe(404);
});

test("mock Claude returning 500: report saves, cleanup verified=false score 70", async () => {
  mock.fail();
  const a = await join();
  const r = await report(a, "M");
  expect(r.status).toBe(200);
  const c = await app.call(`api/reports/${r.data.report.id}/clean`, { photo: PHOTO }, a);
  expect(c.data).toMatchObject({ score: 70, verified: false, reason: "Not checked by Claude", points: 42 });
  expect(c.data.report.status).toBe("cleaned");
});

test("write without token is 401; GET /api/state without token has no me", async () => {
  const r = await app.call("api/reports", { ...seaPin, photo: PHOTO, type: "plastic", size: "M" });
  expect(r.status).toBe(401);
  expect(r.data).toEqual({ error: "Join first" });
  expect((await app.call("api/ai/tag", { photo: PHOTO }, "bogus")).status).toBe(401);
  const s = await app.call("api/state", undefined, "bogus");
  expect(s.status).toBe(200);
  expect(s.data.me).toBeUndefined();
  expect(Array.isArray(s.data.league)).toBe(true);
  expect(s.data.challenge.goal).toBe(50);
});

test("routes work behind a path prefix", async () => {
  expect((await app.call("pantai/api/state")).status).toBe(200);
});

test("body over 3 MB is 413", async () => {
  const t = await join();
  const r = await app.call("api/reports", { ...seaPin, photo: "A".repeat(3.2 * 1024 * 1024), type: "plastic", size: "M" }, t);
  expect(r.status).toBe(413);
  expect(r.data).toEqual({ error: "Photo too large" });
});

test("AI calls are rate limited per token", async () => {
  const t = await join();
  mock.tag({ is_trash: true, type: "plastic", size: "S", summary: "x" });
  for (let i = 0; i < 30; i++) expect((await app.call("api/ai/tag", { photo: PHOTO }, t)).status).toBe(200);
  const r = await app.call("api/ai/tag", { photo: PHOTO }, t);
  expect(r.status).toBe(429);
  expect(r.data).toEqual({ error: "Slow down a little" });
});

test("photo path traversal is rejected", async () => {
  fs.writeFileSync(path.join(dir, "secret.jpg"), "x");
  expect((await fetch(`${app.base}/api/photos/..%2Fsecret.jpg`)).status).toBe(404);
  expect((await fetch(`${app.base}/api/photos/..%2Fdb.json`)).status).toBe(404);
});

test("state survives restart from db.json", async () => {
  const a = await join();
  await report(a, "L");
  app.store.flush();
  await app.close();
  app = await startApp(dir);
  const s = await app.call("api/state", undefined, a);
  expect(s.data.reports).toHaveLength(1);
  expect(s.data.me.player.nickname).toBe("Wayan");
  expect(s.data.me.points).toBe(40);
});

test("serves the web app with index fallback", async () => {
  const web = tmpDir();
  fs.writeFileSync(path.join(web, "index.html"), "<html>pantai</html>");
  fs.mkdirSync(path.join(web, "assets"));
  fs.writeFileSync(path.join(web, "assets", "app.js"), "console.log(1)");
  const w = await startApp(tmpDir(), web);
  try {
    const js = await fetch(`${w.base}/assets/app.js`);
    expect(js.headers.get("content-type")).toContain("text/javascript");
    const deep = await fetch(`${w.base}/league`);
    expect(await deep.text()).toContain("pantai");
    expect((await fetch(`${w.base}/../../etc/passwd`)).status).toBe(200);
  } finally { await w.close(); }
});

test("cleaning a seeded report with an SVG before photo sends only the after photo", async () => {
  const { seed } = await import("../src/seed");
  seed(app.store, { reset: true });
  const t = await join();
  const open = app.store.db.reports.find((r) => r.status === "open")!;
  mock.clean(85, "Clean sand");
  const c = await app.call(`api/reports/${open.id}/clean`, { photo: PHOTO }, t);
  expect(c.data).toMatchObject({ score: 85, verified: true });
  const content = mock.calls.at(-1)!.body.messages[0].content;
  expect(content.filter((x: any) => x.type === "image")).toHaveLength(1);
  expect(content.at(-1).text).toContain("clean beach spot");
  const svg = await fetch(`${app.base}/api/photos/${open.photo}`);
  expect(svg.headers.get("content-type")).toBe("image/svg+xml");
});
