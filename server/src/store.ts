import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Player, Report } from "../../shared/types";

export type StoredPlayer = Player & { token: string };
export interface Db { players: StoredPlayer[]; reports: Report[] }

export interface Store {
  dataDir: string;
  photosDir: string;
  db: Db;
  save(): void;
  flush(): void;
  savePhoto(id: string, data: Buffer, ext?: string): string;
  playerByToken(token: string | undefined | null): StoredPlayer | undefined;
}

function defaultDataDir(): string {
  if (process.env.DATA_DIR) return path.resolve(process.env.DATA_DIR);
  try { return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data"); } catch { return path.resolve("server/data"); }
}

export function createStore(dataDir: string = defaultDataDir()): Store {
  const photosDir = path.join(dataDir, "photos");
  fs.mkdirSync(photosDir, { recursive: true });
  const file = path.join(dataDir, "db.json");
  let db: Db = { players: [], reports: [] };
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    db = { players: Array.isArray(raw.players) ? raw.players : [], reports: Array.isArray(raw.reports) ? raw.reports : [] };
  } catch { /* fresh store */ }

  let timer: NodeJS.Timeout | null = null;
  let dirty = false;
  const write = () => {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!dirty) return;
    dirty = false;
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(store.db));
    fs.renameSync(tmp, file);
  };
  const store: Store = {
    dataDir, photosDir, db,
    save() {
      dirty = true;
      if (!timer) { timer = setTimeout(write, 300); timer.unref?.(); }
    },
    flush() { write(); },
    savePhoto(id, data, ext = "jpg") {
      const name = `${id}.${ext}`;
      fs.writeFileSync(path.join(photosDir, name), data);
      return name;
    },
    playerByToken(token) {
      if (!token) return undefined;
      return store.db.players.find((p) => p.token === token);
    },
  };
  return store;
}

export const publicPlayer = (p: StoredPlayer): Player => {
  const { token: _t, ...rest } = p;
  return rest;
};
