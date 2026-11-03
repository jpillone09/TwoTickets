import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Heart, ListVideo, Plus } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

type Wl = { id: string; kind: string; owner_id: string | null };

/** Add/remove a movie from your watchlist, the shared watchlist, and your custom lists. */
export default function SaveButtons({ movieId, paired }: { movieId: number; paired: boolean }) {
  const { session } = useAuth();
  const uid = session!.user.id;
  const [wls, setWls] = useState<Wl[]>([]);
  const [inWl, setInWl] = useState<Record<string, string>>({}); // watchlist id -> row id
  const [myLists, setMyLists] = useState<{ id: string; name: string }[]>([]);
  const [inLists, setInLists] = useState<string[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [a, b, c, d] = await Promise.all([
      supabase.from("watchlists").select("id,kind,owner_id"),
      supabase.from("watchlist_movies").select("id,watchlist_id").eq("movie_id", movieId),
      supabase.from("movie_lists").select("id,name").eq("user_id", uid).order("created_at"),
      supabase.from("movie_list_items").select("list_id").eq("movie_id", movieId),
    ]);
    setWls((a.data ?? []) as Wl[]);
    setInWl(Object.fromEntries((b.data ?? []).map((r) => [r.watchlist_id as string, r.id as string])));
    const mine = (c.data ?? []) as { id: string; name: string }[];
    setMyLists(mine);
    setInLists((d.data ?? []).map((r) => r.list_id as string).filter((id) => mine.some((l) => l.id === id)));
  }, [movieId, uid]);
  useEffect(() => { load(); }, [load]);

  const personal = wls.find((w) => w.kind === "personal" && w.owner_id === uid);
  const shared = wls.find((w) => w.kind === "shared");

  async function toggleWl(wlId: string) {
    setError("");
    const { error } = inWl[wlId]
      ? await supabase.from("watchlist_movies").delete().eq("id", inWl[wlId])
      : await supabase.from("watchlist_movies").insert({ watchlist_id: wlId, movie_id: movieId, added_by: uid });
    if (error) setError(error.message);
    load();
  }

  async function toggleList(listId: string) {
    setError("");
    const { error } = inLists.includes(listId)
      ? await supabase.from("movie_list_items").delete().eq("list_id", listId).eq("movie_id", movieId)
      : await supabase.from("movie_list_items").insert({ list_id: listId, movie_id: movieId });
    if (error) setError(error.message);
    load();
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {personal && (
          <button className={inWl[personal.id] ? "btn-primary" : "btn-soft"} onClick={() => toggleWl(personal.id)}>
            {inWl[personal.id] ? <Check size={18} /> : <ListVideo size={18} />} {inWl[personal.id] ? "On my watchlist" : "My watchlist"}
          </button>
        )}
        {paired && shared ? (
          <button className={inWl[shared.id] ? "btn-primary" : "btn-soft"} onClick={() => toggleWl(shared.id)}>
            {inWl[shared.id] ? <Check size={18} /> : <Heart size={18} />} {inWl[shared.id] ? "On our watchlist" : "Our watchlist"}
          </button>
        ) : (
          <Link to="/onboarding" className="btn-soft"><Heart size={18} /> Pair up to share a watchlist</Link>
        )}
      </div>
      {myLists.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">My lists:</span>
          {myLists.map((l) => (
            <button key={l.id} onClick={() => toggleList(l.id)} aria-pressed={inLists.includes(l.id)}
              className={`chip flex items-center gap-1 ${inLists.includes(l.id) ? "!bg-primary" : ""}`}>
              {inLists.includes(l.id) ? <Check size={12} /> : <Plus size={12} />} {l.name}
            </button>
          ))}
        </div>
      )}
      {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}
