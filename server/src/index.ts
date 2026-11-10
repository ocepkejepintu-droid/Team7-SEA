import http from "node:http";
import { createApp } from "./app";

const { handler, store } = createApp();
const port = Number(process.env.PORT) || 8791;
const host = process.env.HOST || "127.0.0.1";
const server = http.createServer(handler);
server.listen(port, host, () => {
  console.log(`pantai server on http://${host}:${port} data=${store.dataDir} ai=${process.env.ANTHROPIC_API_KEY ? "on" : "off"}`);
});
const stop = () => { try { store.flush(); } finally { process.exit(0); } };
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
