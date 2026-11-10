import { useCallback, useEffect, useRef, useState } from "react";
import type { GameState } from "@shared/types";
import { api, ApiError, getToken, setToken } from "./api";

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
      const s = await api.state();
      // a token the server no longer knows (data reset): back to onboarding
      if (getToken() && !s.me) { setToken(null); setJoined(false); }
      setState(s); setError(null);
    } catch (e) { setError(e instanceof ApiError ? e.message : "Can't reach the server"); }
    finally { busy.current = false; }
  }, []);
  useEffect(() => { refresh(); const t = setInterval(refresh, 5000); return () => clearInterval(t); }, [refresh]);
  const join = useCallback(async (nickname: string, avatar: string) => {
    const { token } = await api.join(nickname, avatar);
    setToken(token); setJoined(true); await refresh();
  }, [refresh]);
  return { state, error, refresh, joined, join };
}
