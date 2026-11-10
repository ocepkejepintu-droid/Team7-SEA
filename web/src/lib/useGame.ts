import { useCallback, useEffect, useRef, useState } from "react";
import type { GameState } from "@shared/types";
import { api, ApiError, getToken, setToken } from "./api";

/** `error` is set while polling fails; the UI shows its own translated message. */
export interface Game { state: GameState | null; error: string | null; refresh: () => Promise<void>; joined: boolean; join: (nickname: string, avatar: string) => Promise<void> }

/** Polls the shared game state every 5 s. */
export function useGame(): Game {
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(() => !!getToken());
  const busy = useRef(false);
  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const sent = getToken();
      const s = await api.state();
      // a token the server no longer knows (data reset): back to onboarding. Only when that same token was sent:
      // a poll that started before joining carries no token and must not log the new player out.
      if (sent && sent === getToken() && !s.me) { setToken(null); setJoined(false); }
      if (sent !== getToken()) return;
      setState(s); setError(null);
    } catch (e) { setError(e instanceof ApiError ? e.message : "offline"); }
    finally { busy.current = false; }
  }, []);
  useEffect(() => { refresh(); const t = setInterval(refresh, 5000); return () => clearInterval(t); }, [refresh]);
  const join = useCallback(async (nickname: string, avatar: string) => {
    const { token } = await api.join(nickname, avatar);
    setToken(token); setJoined(true); busy.current = false; await refresh();
  }, [refresh]);
  return { state, error, refresh, joined, join };
}
