import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Camera, Pencil } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import Avatar from "../components/Avatar";
import ReviewCard from "../components/ReviewCard";
import { Stars } from "../components/StarRating";
import { img, yearOf } from "../lib/tmdb";
import { fmtDate, timeAgo, type ReviewRow } from "../lib/types";

type Mv = { id: number; title: string; poster_path: string | null };
type P = {
  id: string; username: string; display_name: string | null; bio: string | null; avatar_url: string | null;
  favorite_genre: string | null; favorite_movie_id: number | null; favorite_movie: Mv | null;
};
type D = {
  id: string; watched_on: string; rating: number | null; is_rewatch: boolean; watched_together: boolean; created_at: string;
  movie: Mv & { release_date: string | null; genres: { name: string }[]; director: string | null };
};
type WL = { id: string; status: string; movie: Mv };
type L = { id: string; name: string; description: string | null; items: { movie_id: number; movie: Mv }[] };
type Fav = { position: number; movie: Mv };

const TABS = ["Overview", "Diary", "Reviews", "Watchlist", "Favorites", "Lists", "Activity"] as const;
const GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", "Fantasy", "History",
  "Horror", "Music", "Mystery", "Romance", "Science Fiction", "Thriller", "War", "Western"];

const top = (arr: string[], n = 3) => {
  const m = new Map<string, number>();
  arr.forEach((a) => m.set(a, (m.get(a) ?? 0) + 1));
  return [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
};

function Posters({ movies, empty }: { movies: Mv[]; empty: string }) {
  if (!movies.length) return <p className="text-muted-foreground">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-4">
      {movies.map((m, i) => (
        <Link key={`${m.id}-${i}`} to={`/app/movie/${m.id}`} title={m.title} className="w-24 md:w-28">
          {m.poster_path
            ? <img src={img(m.poster_path, "w185")!} alt={m.title} className="aspect-[2/3] rounded-xl border-4 border-white object-cover shadow-md" />
            : <div className="flex aspect-[2/3] items-center justify-center rounded-xl bg-secondary p-1 text-center text-xs">{m.title}</div>}
        </Link>
      ))}
    </div>
  );
}

export default function Profile() {
  const { username } = useParams();
  const { session } = useAuth();
  const uid = session!.user.id;
  const [prof, setProf] = useState<P | null | undefined>(undefined);
  const [diary, setDiary] = useState<D[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [favs, setFavs] = useState<Fav[]>([]);
  const [lists, setLists] = useState<L[]>([]);
  const [wl, setWl] = useState<WL[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setProf(undefined);
    const { data: p } = await supabase.from("profiles")
      .select("id,username,display_name,bio,avatar_url,favorite_genre,favorite_movie_id,favorite_movie:movies!favorite_movie_id(id,title,poster_path)")
      .eq("username", username ?? "").maybeSingle();
    if (!p) return setProf(null);
    const [d, r, f, l, w] = await Promise.all([
      supabase.from("diary_entries")
        .select("id,watched_on,rating,is_rewatch,watched_together,created_at,movie:movies(id,title,poster_path,release_date,genres,director)")
        .eq("user_id", p.id).order("watched_on", { ascending: false }).limit(1000),
      supabase.from("reviews").select("*, movie:movies(id,title,poster_path,release_date), author:profiles!user_id(id,display_name,username)")
        .eq("user_id", p.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("favorite_movies").select("position,movie:movies(id,title,poster_path)").eq("user_id", p.id).order("position"),
      supabase.from("movie_lists").select("id,name,description,items:movie_list_items(movie_id,movie:movies(id,title,poster_path))").eq("user_id", p.id),
      supabase.from("watchlists").select("id").eq("kind", "personal").eq("owner_id", p.id).maybeSingle(),
    ]);
    let items: WL[] = [];
    if (w.data) {
      const { data } = await supabase.from("watchlist_movies").select("id,status,movie:movies(id,title,poster_path)").eq("watchlist_id", w.data.id);
      items = (data ?? []) as unknown as WL[];
    }
    setDiary((d.data ?? []) as unknown as D[]);
    setReviews((r.data ?? []) as unknown as ReviewRow[]);
    setFavs((f.data ?? []) as unknown as Fav[]);
    setLists((l.data ?? []) as unknown as L[]);
    setWl(items);
    setProf(p as unknown as P);
  }, [username]);
  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const unique = new Map<number, D["movie"]>();
    diary.forEach((d) => unique.set(d.movie.id, d.movie));
    const rated = diary.filter((d) => d.rating !== null);
    const year = String(new Date().getFullYear());
    return {
      watched: unique.size,
      reviews: reviews.filter((r) => r.body).length,
      avg: rated.length ? (rated.reduce((s, d) => s + (d.rating ?? 0), 0) / rated.length).toFixed(2) : "–",
      rewatches: diary.filter((d) => d.is_rewatch).length,
      watchlist: wl.filter((w) => w.status === "to_watch").length,
      thisYear: new Set(diary.filter((d) => d.watched_on.startsWith(year)).map((d) => d.movie.id)).size,
      genres: top([...unique.values()].flatMap((m) => m.genres.map((g) => g.name))),
      directors: top([...unique.values()].flatMap((m) => (m.director ? m.director.split(", ") : []))),
    };
  }, [diary, reviews, wl]);

  if (prof === undefined) return <p className="text-muted-foreground">Loading…</p>;
  if (prof === null)
    return <div className="sticker-card mx-auto mt-10 max-w-md p-8 text-center"><h1 className="text-2xl">Profile not found</h1>
      <p className="mt-2 text-muted-foreground">You can only see your own profile and your partner's.</p></div>;

  const own = prof.id === uid;
  const activity = [
    ...diary.map((d) => ({ at: d.created_at, text: `${d.is_rewatch ? "Rewatched" : "Logged"} ${d.movie.title}`, id: d.movie.id, k: "d" + d.id })),
    ...reviews.map((r) => ({ at: r.created_at, text: `${r.body ? "Reviewed" : "Rated"} ${r.movie?.title ?? "a movie"}`, id: r.movie_id, k: "r" + r.id })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 40);

  const statCards: [string, string | number][] = [
    ["Movies watched", stats.watched], ["Reviews written", stats.reviews], ["Average rating", stats.avg], ["Rewatches", stats.rewatches],
    ["On watchlist", stats.watchlist], ["Watched this year", stats.thisYear],
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="sticker-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <Avatar url={prof.avatar_url} name={prof.display_name ?? prof.username} size={96} />
        <div className="flex-1">
          <h1 className="text-3xl">{prof.display_name ?? prof.username}</h1>
          <p className="text-muted-foreground">@{prof.username}</p>
          {prof.bio && <p className="mt-2">{prof.bio}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {prof.favorite_genre && <span className="chip">Loves {prof.favorite_genre}</span>}
            {prof.favorite_movie && <Link to={`/app/movie/${prof.favorite_movie.id}`} className="chip !bg-butter">Favorite: {prof.favorite_movie.title}</Link>}
          </div>
        </div>
        {own && <button className="btn-soft" onClick={() => setEditing((e) => !e)}><Pencil size={16} /> {editing ? "Close" : "Edit profile"}</button>}
      </div>

      {editing && <EditProfile prof={prof} favs={favs.map((f) => f.movie)} onDone={() => { setEditing(false); load(); }} />}

      <div className="mt-5 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={tab === t ? "btn-primary !py-1.5" : "btn-soft !py-1.5"}>{t}</button>)}
      </div>

      <div className="mt-5 space-y-5">
        {tab === "Overview" && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {statCards.map(([label, v]) => (
                <div key={label} className="sticker-card p-4 text-center"><p className="font-heading text-3xl font-bold text-berry">{v}</p>
                  <p className="text-sm text-muted-foreground">{label}</p></div>
              ))}
            </div>
            <div className="sticker-card space-y-2 p-4 text-sm">
              <p><b>Favorite genres:</b> {stats.genres.join(", ") || "Not enough data yet"}</p>
              <p><b>Favorite directors:</b> {stats.directors.join(", ") || "Not enough data yet"}</p>
            </div>
            {favs.length > 0 && <section><h2 className="mb-2 text-xl">Favorites</h2><Posters movies={favs.slice(0, 6).map((f) => f.movie)} empty="" /></section>}
            <section><h2 className="mb-2 text-xl">Recently watched</h2>
              <Posters movies={diary.slice(0, 8).map((d) => d.movie)} empty="Nothing logged yet." /></section>
          </>
        )}
        {tab === "Diary" && (diary.length === 0 ? <p className="text-muted-foreground">Nothing logged yet.</p> : (
          <div className="space-y-2">
            {diary.slice(0, 100).map((d) => (
              <Link key={d.id} to={`/app/movie/${d.movie.id}`} className="sticker-card flex items-center gap-3 p-3">
                <span className="w-24 text-sm font-bold text-berry">{fmtDate(d.watched_on)}</span>
                <span className="flex-1 font-semibold">{d.movie.title} <span className="font-normal text-muted-foreground">{yearOf(d.movie.release_date)}</span></span>
                <Stars value={d.rating} size={14} />
              </Link>
            ))}
          </div>
        ))}
        {tab === "Reviews" && (reviews.length === 0 ? <p className="text-muted-foreground">No reviews yet.</p> :
          reviews.map((r) => <ReviewCard key={r.id} review={r} showMovie onChanged={load} />))}
        {tab === "Watchlist" && <Posters movies={wl.filter((w) => w.status === "to_watch").map((w) => w.movie)} empty="The watchlist is empty." />}
        {tab === "Favorites" && <Posters movies={favs.map((f) => f.movie)} empty="No favorites yet. Use “Add to favorites” on a movie page." />}
        {tab === "Lists" && (lists.length === 0 ? <p className="text-muted-foreground">No lists yet.</p> : lists.map((l) => (
          <section key={l.id} className="sticker-card p-4"><h2 className="text-lg">{l.name}</h2>
            {l.description && <p className="mb-2 text-sm text-muted-foreground">{l.description}</p>}
            <Posters movies={l.items.map((i) => i.movie)} empty="Empty list." /></section>
        )))}
        {tab === "Activity" && (activity.length === 0 ? <p className="text-muted-foreground">No activity yet.</p> : (
          <div className="space-y-2">
            {activity.map((a) => (
              <Link key={a.k} to={`/app/movie/${a.id}`} className="sticker-card flex items-center justify-between p-3">
                <span>{a.text}</span><span className="text-xs text-muted-foreground">{timeAgo(a.at)}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditProfile({ prof, favs, onDone }: { prof: P; favs: Mv[]; onDone: () => void }) {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(prof.username);
  const [name, setName] = useState(prof.display_name ?? "");
  const [bio, setBio] = useState(prof.bio ?? "");
  const [genre, setGenre] = useState(prof.favorite_genre ?? "");
  const [favId, setFavId] = useState(prof.favorite_movie_id ? String(prof.favorite_movie_id) : "");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function pick(f: File | undefined) {
    setError("");
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Please choose an image file.");
    if (f.size > 2 * 1024 * 1024) return setError("Image must be under 2 MB.");
    setFile(f);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    const uname = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(uname)) return setError("Username: 3–20 letters, numbers or underscores.");
    setBusy(true);
    try {
      let avatar_url = prof.avatar_url;
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
        const path = `${prof.id}/avatar-${Date.now()}.${ext}`;
        const up = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
        if (up.error) throw up.error;
        avatar_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("profiles").update({
        username: uname, display_name: name.trim() || uname, bio: bio.trim() || null, favorite_genre: genre || null,
        favorite_movie_id: favId ? Number(favId) : null, avatar_url,
      }).eq("id", prof.id);
      if (error) throw error.code === "23505" ? new Error("That username is taken.") : error;
      await refreshProfile();
      if (uname !== prof.username) navigate(`/app/u/${uname}`, { replace: true });
      else onDone();
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="sticker-card mt-5 space-y-3 p-5">
      <label className="btn-soft cursor-pointer"><Camera size={18} /> {file ? file.name : "Change profile picture"}
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">Display name<input className="input mt-1" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} /></label>
        <label className="text-sm font-semibold">Username<input className="input mt-1" value={username} maxLength={20} onChange={(e) => setUsername(e.target.value)} /></label>
      </div>
      <label className="block text-sm font-semibold">Bio<textarea className="input mt-1 rounded-sticker" rows={3} maxLength={300} value={bio} onChange={(e) => setBio(e.target.value)} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">Favorite genre
          <select className="input mt-1" value={genre} onChange={(e) => setGenre(e.target.value)}><option value="">None</option>{GENRES.map((g) => <option key={g}>{g}</option>)}</select></label>
        <label className="text-sm font-semibold">Favorite movie
          <select className="input mt-1" value={favId} onChange={(e) => setFavId(e.target.value)}>
            <option value="">None</option>{favs.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</select>
          {favs.length === 0 && <span className="mt-1 block text-xs font-normal text-muted-foreground">Add movies to your favorites first.</span>}</label>
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
    </form>
  );
}
