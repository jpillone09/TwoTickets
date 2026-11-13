import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ListVideo, Heart, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import MovieCard from "../components/MovieCard";
import { img, tmdb, type MovieSummary, type Page } from "../lib/tmdb";
import { timeAgo } from "../lib/types";

type Rec = {
  id: string; message: string | null; status: string; created_at: string; sender_id: string; recipient_id: string; movie_id: number;
  movie: { id: number; title: string; poster_path: string | null };
  sender: { display_name: string | null } | null; recipient: { display_name: string | null } | null;
};
type Wl = { id: string; kind: string; owner_id: string | null };
type RevRow = { movie_id: number; rating: number; user_id: string; movie: { id: number; title: string; poster_path: string | null; release_date: string | null } };
type Row = { title: string; movies: MovieSummary[] };

const LABEL: Record<string, string> = {
  pending: "Waiting", accepted: "Accepted", dismissed: "Dismissed", added_personal: "Added to a watchlist", added_shared: "Added to our watchlist",
};

export default function ForYou() {
  const { session, profile } = useAuth();
  const uid = session!.user.id;
  const [recs, setRecs] = useState<Rec[]>([]);
  const [wls, setWls] = useState<Wl[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

  const loadRecs = useCallback(async () => {
    const [r, w] = await Promise.all([
      supabase.from("recommendations")
        .select("id,message,status,created_at,sender_id,recipient_id,movie_id,movie:movies(id,title,poster_path),sender:profiles!recommendations_sender_id_fkey(display_name),recipient:profiles!recommendations_recipient_id_fkey(display_name)")
        .order("created_at", { ascending: false }).limit(50),
      supabase.from("watchlists").select("id,kind,owner_id"),
    ]);
    setRecs((r.data ?? []) as unknown as Rec[]);
    setWls((w.data ?? []) as Wl[]);
  }, []);
  useEffect(() => { loadRecs(); }, [loadRecs]);

  async function act(rec: Rec, status: string, wlKind?: "personal" | "shared") {
    setError("");
    if (wlKind) {
      const wl = wls.find((w) => w.kind === wlKind && (wlKind === "shared" || w.owner_id === uid));
      if (!wl) return setError("Couldn't find that watchlist.");
      const { error } = await supabase.from("watchlist_movies").insert({ watchlist_id: wl.id, movie_id: rec.movie_id, added_by: uid });
      if (error && error.code !== "23505") return setError(error.message); // 23505 = already on the list
    }
    const { error } = await supabase.from("recommendations").update({ status }).eq("id", rec.id);
    if (error) setError(error.message);
    loadRecs();
  }

  // Suggestions built from ratings of you and your partner
  useEffect(() => {
    (async () => {
      const [rv, dr] = await Promise.all([
        supabase.from("reviews").select("movie_id,rating,user_id,movie:movies(id,title,poster_path,release_date)").gte("rating", 4),
        supabase.from("diary_entries").select("movie_id,user_id").limit(3000),
      ]);
      const loved = (rv.data ?? []) as unknown as RevRow[];
      const diary = dr.data ?? [];
      const myWatched = new Set(diary.filter((d) => d.user_id === uid).map((d) => d.movie_id as number));
      const anyWatched = new Set(diary.map((d) => d.movie_id as number));
      const toSummary = (m: RevRow["movie"]): MovieSummary => ({ ...m, vote_average: 0 });
      const out: Row[] = [];

      const partnerLoved = loved.filter((r) => r.user_id !== uid && !myWatched.has(r.movie_id));
      if (partnerLoved.length) out.push({ title: "Your partner loved these", movies: partnerLoved.map((r) => toSummary(r.movie)) });

      const mine = loved.filter((r) => r.user_id === uid).sort((a, b) => b.rating - a.rating);
      const theirIds = new Set(loved.filter((r) => r.user_id !== uid).map((r) => r.movie_id));
      const both = mine.filter((r) => theirIds.has(r.movie_id)).slice(0, 2);
      const bothIds = new Set(both.map((b) => b.movie_id));
      const seeds = [
        ...both.map((s) => ({ s, title: `For both of you: more like ${s.movie.title}` })),
        ...mine.filter((r) => !bothIds.has(r.movie_id)).slice(0, 3).map((s) => ({ s, title: `Because you loved ${s.movie.title}` })),
      ];
      const seen = new Set<number>(partnerLoved.map((r) => r.movie_id));
      const sims = await Promise.all(seeds.map(({ s }) => tmdb<Page>({ action: "similar", id: s.movie_id }).catch(() => null)));
      sims.forEach((p, i) => {
        const movies = (p?.results ?? []).filter((m) => !anyWatched.has(m.id) && !seen.has(m.id)).slice(0, 12);
        movies.forEach((m) => seen.add(m.id));
        if (movies.length) out.push({ title: seeds[i].title, movies });
      });
      setRows(out);
    })().catch((e) => setError((e as Error).message));
  }, [uid]);

  const incoming = recs.filter((r) => r.recipient_id === uid);
  const sent = recs.filter((r) => r.sender_id === uid);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl">For you</h1>
      {error && <p role="alert" className="mt-3 font-semibold text-destructive">{error}</p>}

      <section className="mt-6">
        <h2 className="mb-3 text-xl">From your partner</h2>
        {!profile?.couple_id && <p className="text-muted-foreground">Pair up to send and receive recommendations. <Link to="/onboarding" className="font-bold text-berry underline">Pair up</Link></p>}
        {profile?.couple_id && incoming.length === 0 && <p className="text-muted-foreground">No recommendations yet. Use "Recommend" on any movie page.</p>}
        <div className="space-y-3">
          {incoming.map((r) => (
            <div key={r.id} className="sticker-card flex gap-4 p-3">
              <Link to={`/app/movie/${r.movie_id}`} className="w-16 shrink-0">
                {r.movie.poster_path && <img src={img(r.movie.poster_path, "w185")!} alt="" className="rounded-lg border-2 border-card shadow" />}
              </Link>
              <div className="flex-1 space-y-2">
                <p><b>{r.sender?.display_name ?? "Your partner"}</b> recommends <Link to={`/app/movie/${r.movie_id}`} className="font-bold text-berry">{r.movie.title}</Link>
                  <span className="text-xs text-muted-foreground"> · {timeAgo(r.created_at)}</span></p>
                {r.message && <p className="rounded-xl bg-secondary p-2 text-sm">“{r.message}”</p>}
                {r.status === "pending" ? (
                  <div className="flex flex-wrap gap-2 text-sm">
                    <button className="btn-soft !py-1" onClick={() => act(r, "accepted")}><Check size={16} /> Sounds good</button>
                    <button className="btn-soft !py-1" onClick={() => act(r, "added_personal", "personal")}><ListVideo size={16} /> My watchlist</button>
                    <button className="btn-soft !py-1" onClick={() => act(r, "added_shared", "shared")}><Heart size={16} /> Our watchlist</button>
                    <button className="btn-soft !py-1" onClick={() => act(r, "dismissed")}><X size={16} /> Dismiss</button>
                  </div>
                ) : <span className="chip">{LABEL[r.status] ?? r.status}</span>}
              </div>
            </div>
          ))}
        </div>
        {sent.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold text-muted-foreground">Sent by you ({sent.length})</summary>
            <ul className="mt-2 space-y-1 text-sm">
              {sent.map((r) => <li key={r.id}>{r.movie.title} → {r.recipient?.display_name ?? "partner"} <span className="chip">{LABEL[r.status] ?? r.status}</span></li>)}
            </ul>
          </details>
        )}
      </section>

      {rows.map((row) => (
        <section key={row.title} className="mt-8">
          <h2 className="mb-3 text-xl">{row.title}</h2>
          <div className="flex gap-4 overflow-x-auto pb-3">{row.movies.map((m) => <MovieCard key={m.id} movie={m} />)}</div>
        </section>
      ))}
      {rows.length === 0 && <p className="mt-8 text-muted-foreground">Rate a few movies 4 stars or higher and suggestions will show up here.</p>}
    </div>
  );
}
