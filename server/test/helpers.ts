import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app";

export const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "pantai-test-"));

export async function startApp(dataDir: string, webDir?: string) {
  const app = createApp({ dataDir, webDir });
  const server = http.createServer(app.handler);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const call = async (p: string, body?: unknown, token?: string, raw?: string) => {
    const res = await fetch(`${base}/${p}`, {
      method: body === undefined && raw === undefined ? "GET" : "POST",
      headers: { "content-type": "application/json", ...(token ? { "x-player-token": token } : {}) },
      body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
    const text = await res.text();
    let data: any; try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data, headers: res.headers };
  };
  return { ...app, base, call, close: () => new Promise<void>((r) => { server.closeAllConnections?.(); server.close(() => r()); }) };
}
