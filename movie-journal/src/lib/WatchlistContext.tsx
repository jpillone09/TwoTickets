import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "./supabase";
import { tmdb } from "./tmdb";
import { useAuth } from "../auth/AuthProvider";

type Ctx = { ready: boolean; busy: number | null; has: (id: number) => boolean; toggle: (id: number) => Promise<void> };
const WatchlistCtx = createContext<Ctx>({ ready: false, busy: null, has: () => false, toggle: async () => {} });
export const useMyWatchlist = () => useContext(WatchlistCtx);

/** Keeps your personal watchlist in memory so every poster can show a quick add/remove button. */
export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const uid = session?.user.id;
  const location = useLocation();
  const [wlId, setWlId] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!uid) return;
    const { data: wl } = await supabase.from("watchlists").select("id").eq("kind", "personal").eq("owner_id", uid).maybeSingle();
    if (!wl) return;
    setWlId(wl.id);
    const { data } = await supabase.from("watchlist_movies").select("id,movie_id").eq("watchlist_id", wl.id);
    setRows(Object.fromEntries((data ?? []).map((r) => [r.movie_id as number, r.id as string])));
  }, [uid]);
  useEffect(() => { load(); }, [load, location.pathname]);

  const toggle = async (movieId: number) => {
    if (!wlId || !uid) return;
    setBusy(movieId);
    try {
      if (rows[movieId]) {
        const { error } = await supabase.from("watchlist_movies").delete().eq("id", rows[movieId]);
        if (error) throw error;
      } else {
        await tmdb({ action: "movie", id: movieId }); // makes sure the movie is saved in our database first
        const { error } = await supabase.from("watchlist_movies").insert({ watchlist_id: wlId, movie_id: movieId, added_by: uid });
        if (error) throw error;
      }
      await load();
    } catch (e) {
      setError((e as Error).message);
      setTimeout(() => setError(""), 4000);
    }
    setBusy(null);
  };

  return (
    <WatchlistCtx.Provider value={{ ready: !!wlId, busy, has: (id) => id in rows, toggle }}>
      {children}
      {error && (
        <div role="alert" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-destructive px-5 py-2 text-sm font-semibold text-white shadow-lg">
          {error}
        </div>
      )}
    </WatchlistCtx.Provider>
  );
}
