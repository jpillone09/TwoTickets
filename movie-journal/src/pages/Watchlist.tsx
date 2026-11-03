import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Dices, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { img, yearOf } from "../lib/tmdb";

type Item = {
  id: string; movie_id: number; note: string | null; priority: number; status: "to_watch" | "watched";
  watched_together: boolean; added_at: string; added_by: string;
  movie: { id: number; title: string; poster_path: string | null; release_date: string | null; tmdb_rating: number | null; genres: { id: number; name: string }[] };
  adder: { display_name: string | null } | null;
};
type PartnerInfo = { watched: boolean; rating: number | null };

const PRIORITY = ["No priority", "Low", "Medium", "High"];
const SORTS: Record<string, string> = {
  newest: "Recently added", oldest: "Oldest added", title: "Title A–Z", year: "Release year", rating: "TMDB rating", priority: "Priority",
};

function NoteField({ value, onSave }: { value: string | null; onSave: (v: string | null) => void }) {
  const [v, setV] = useState(value ?? "");
  return (
    <input className="input !py-1.5 text-sm" placeholder="Add a note…" value={v} maxLength={300}
      onChange={(e) => setV(e.target.value)} onBlur={() => v !== (value ?? "") && onSave(v.trim() || null)} />
  );
}

export default function Watchlist({ kind }: { kind: "personal" | "shared" }) {
  const { session, profile } = useAuth();
  const uid = session!.user.id;
  const shared = kind === "shared";
  const [items, setItems] = useState<Item[]>([]);
  const [partner, setPartner] = useState<Record<number, PartnerInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState("newest");
  const [status, setStatus] = useState<"to_watch" | "watched" | "all">("to_watch");
  const [pick, setPick] = useState<Item | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    if (shared && !profile.couple_id) return setLoading(false);
    const base = supabase.from("watchlists").select("id").eq("kind", kind);
    const { data: wl } = await (shared ? base.eq("couple_id", profile.couple_id!) : base.eq("owner_id", uid)).maybeSingle();
    if (!wl) return setLoading(false);
    const { data } = await supabase.from("watchlist_movies")
      .select("id,movie_id,note,priority,status,watched_together,added_at,added_by,movie:movies(id,title,poster_path,release_date,tmdb_rating,genres),adder:profiles(display_name)")
      .eq("watchlist_id", wl.id);
    const list = (data ?? []) as unknown as Item[];
    setItems(list);
    if (profile.couple_id && list.length) {
      const ids = list.map((i) => i.movie_id);
      const [d, r] = await Promise.all([
        supabase.from("diary_entries").select("movie_id").in("movie_id", ids).neq("user_id", uid),
        supabase.from("reviews").select("movie_id,rating").in("movie_id", ids).neq("user_id", uid),
      ]);
      const m: Record<number, PartnerInfo> = {};
      (d.data ?? []).forEach((x) => { m[x.movie_id] = { watched: true, rating: m[x.movie_id]?.rating ?? null }; });
      (r.data ?? []).forEach((x) => { m[x.movie_id] = { watched: m[x.movie_id]?.watched ?? false, rating: x.rating }; });
      setPartner(m);
    }
    setLoading(false);
  }, [kind, shared, uid, profile]);
  useEffect(() => { load(); }, [load]);

  async function patch(id: string, fields: Partial<Pick<Item, "note" | "priority" | "status" | "watched_together">>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...fields } : i)));
    const { error } = await supabase.from("watchlist_movies").update(fields).eq("id", id);
    if (error) { setError(error.message); load(); }
  }

  async function watchedTogether(it: Item) {
    await patch(it.id, { status: "watched", watched_together: true });
    const { error } = await supabase.from("diary_entries").insert({ user_id: uid, movie_id: it.movie_id, watched_together: true });
    if (error) setError(error.message);
  }

  async function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    const { error } = await supabase.from("watchlist_movies").delete().eq("id", id);
    if (error) { setError(error.message); load(); }
  }

  const genres = useMemo(() => [...new Set(items.flatMap((i) => i.movie.genres.map((g) => g.name)))].sort(), [items]);
  const years = useMemo(() => [...new Set(items.map((i) => yearOf(i.movie.release_date)).filter(Boolean))].sort().reverse(), [items]);

  const shown = items
    .filter((i) =>
      (status === "all" || i.status === status) &&
      i.movie.title.toLowerCase().includes(search.toLowerCase()) &&
      (!genre || i.movie.genres.some((g) => g.name === genre)) &&
      (!year || yearOf(i.movie.release_date) === year))
    .sort((a, b) => {
      switch (sort) {
        case "oldest": return a.added_at.localeCompare(b.added_at);
        case "title": return a.movie.title.localeCompare(b.movie.title);
        case "year": return (b.movie.release_date ?? "").localeCompare(a.movie.release_date ?? "");
        case "rating": return (b.movie.tmdb_rating ?? 0) - (a.movie.tmdb_rating ?? 0);
        case "priority": return b.priority - a.priority;
        default: return b.added_at.localeCompare(a.added_at);
      }
    });

  function randomPick() {
    const pool = shown.filter((i) => i.status === "to_watch");
    setPick(pool.length ? pool[Math.floor(Math.random() * pool.length)] : null);
    if (!pool.length) setError("Nothing left to pick from. Add some movies first!");
  }

  if (shared && profile && !profile.couple_id)
    return (
      <div className="sticker-card mx-auto mt-10 max-w-lg p-8 text-center">
        <h1 className="text-2xl">Our watchlist</h1>
        <p className="mt-2 text-muted-foreground">Pair up with your partner to build a watchlist you both can add to.</p>
        <Link to="/onboarding" className="btn-primary mt-5">Pair up</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl">{shared ? "Our watchlist" : "My watchlist"}</h1>
        {shared && <button className="btn-primary" onClick={randomPick}><Dices size={18} /> Pick a movie for us</button>}
      </div>

      {pick && (
        <div className="sticker-card mt-4 flex items-center gap-4 !bg-butter p-4">
          {pick.movie.poster_path && <img src={img(pick.movie.poster_path, "w185")!} alt="" className="w-16 rounded-lg border-2 border-white" />}
          <div className="flex-1">
            <p className="text-sm font-semibold">Tonight's pick</p>
            <Link to={`/app/movie/${pick.movie_id}`} className="font-heading text-xl font-bold">{pick.movie.title}</Link>
          </div>
          <button className="btn-soft" onClick={randomPick}>Roll again</button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <input className="input min-w-[10rem] flex-1" placeholder="Search this list…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Status">
          <option value="to_watch">To watch</option><option value="watched">Watched</option><option value="all">All</option>
        </select>
        <select className="input w-auto" value={genre} onChange={(e) => setGenre(e.target.value)} aria-label="Genre">
          <option value="">All genres</option>{genres.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select className="input w-auto" value={year} onChange={(e) => setYear(e.target.value)} aria-label="Release year">
          <option value="">All years</option>{years.map((y) => <option key={y}>{y}</option>)}
        </select>
        <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {error && <p role="alert" className="mt-3 font-semibold text-destructive">{error}</p>}
      {loading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      {!loading && shown.length === 0 && (
        <p className="mt-6 text-muted-foreground">
          {items.length ? "Nothing matches these filters." : <>Nothing here yet. Find a movie in <Link to="/app/discover" className="font-bold text-berry underline">Discover</Link> and add it.</>}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {shown.map((it) => {
          const p = partner[it.movie_id];
          return (
            <div key={it.id} className="sticker-card flex gap-4 p-3">
              <Link to={`/app/movie/${it.movie_id}`} className="w-16 shrink-0">
                {it.movie.poster_path && <img src={img(it.movie.poster_path, "w185")!} alt="" className="rounded-lg border-2 border-white shadow" />}
              </Link>
              <div className="min-w-0 flex-1 space-y-2">
                <Link to={`/app/movie/${it.movie_id}`} className="font-heading font-bold">
                  {it.movie.title} <span className="font-body font-normal text-muted-foreground">{yearOf(it.movie.release_date)}</span>
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {shared && <span className="chip">Added by {it.added_by === uid ? "you" : it.adder?.display_name ?? "partner"}</span>}
                  {it.status === "watched" && <span className="chip !bg-accent">{it.watched_together ? "Watched together" : "Watched"}</span>}
                  {p?.watched && <span className="chip !bg-accent">Partner watched</span>}
                  {p?.rating && <span className="chip !bg-butter">Partner rated {p.rating}★</span>}
                  {it.movie.genres.slice(0, 2).map((g) => <span key={g.id} className="chip">{g.name}</span>)}
                </div>
                <NoteField value={it.note} onSave={(note) => patch(it.id, { note })} />
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <select className="input w-auto !py-1" value={it.priority} aria-label="Priority"
                    onChange={(e) => patch(it.id, { priority: Number(e.target.value) })}>
                    {PRIORITY.map((l, i) => <option key={l} value={i}>{l}</option>)}
                  </select>
                  {it.status === "to_watch" ? (
                    <>
                      {shared
                        ? <button className="btn-soft !py-1" onClick={() => watchedTogether(it)}><Check size={16} /> Watched together</button>
                        : <button className="btn-soft !py-1" onClick={() => patch(it.id, { status: "watched" })}><Check size={16} /> Mark watched</button>}
                    </>
                  ) : (
                    <button className="btn-soft !py-1" onClick={() => patch(it.id, { status: "to_watch", watched_together: false })}>Move back to to-watch</button>
                  )}
                  <button aria-label="Remove" className="ml-auto text-muted-foreground hover:text-destructive" onClick={() => remove(it.id)}><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
