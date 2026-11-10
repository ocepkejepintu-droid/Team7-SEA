import http from "node:http";
import type { AddressInfo } from "node:net";

export type MockReply = { kind: "text"; text: string } | { kind: "status"; status: number };

export async function startMock() {
  let reply: MockReply = { kind: "text", text: "{}" };
  const calls: { headers: http.IncomingHttpHeaders; body: any }[] = [];
  const server = http.createServer((req, res) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try { calls.push({ headers: req.headers, body: JSON.parse(data) }); } catch { calls.push({ headers: req.headers, body: null }); }
      if (reply.kind === "status") { res.writeHead(reply.status, { "content-type": "application/json" }); res.end('{"error":"boom"}'); return; }
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ content: [{ type: "text", text: reply.text }] }));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as AddressInfo).port;
  return {
    url: `http://127.0.0.1:${port}`,
    calls,
    tag: (o: { is_trash?: boolean; type?: string; size?: string; summary?: string }) => { reply = { kind: "text", text: `Sure: ${JSON.stringify(o)}` }; },
    clean: (score: number, reason = "Looks clean") => { reply = { kind: "text", text: JSON.stringify({ clean_score: score, reason }) }; },
    fail: (status = 500) => { reply = { kind: "status", status }; },
    close: () => new Promise<void>((r) => server.close(() => r())),
  };
}
