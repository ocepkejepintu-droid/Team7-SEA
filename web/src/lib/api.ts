import type { GameState, Player, Report, Size, Tag, TrashType } from "@shared/types";

const KEY = "pantai.token";
export const getToken = (): string | null => { try { return localStorage.getItem(KEY); } catch { return null; } };
export const setToken = (t: string | null) => { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch { /* private mode */ } };

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

async function call<T>(path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`api/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { ...(body === undefined ? {} : { "content-type": "application/json" }), ...(token ? { "x-player-token": token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}

export interface ReportResult { report: Report; points: number; newBadges: string[] }
export interface CleanResult { report: Report; points: number; score: number; reason: string; verified: boolean; newBadges: string[] }

export const api = {
  join: (nickname: string, avatar: string) => call<{ player: Player; token: string }>("players", { nickname, avatar }),
  state: () => call<GameState>("state"),
  /** photo: base64 JPEG without the data: prefix */
  tag: (photo: string) => call<Tag>("ai/tag", { photo }),
  report: (r: { lng: number; lat: number; photo: string; type: TrashType; size: Size; note?: string }) => call<ReportResult>("reports", r),
  clean: (id: string, photo: string) => call<CleanResult>(`reports/${id}/clean`, { photo }),
  photoUrl: (photo: string) => `api/photos/${photo}`,
};
