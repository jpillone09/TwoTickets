import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Dices, Plus, Search, Star, X } from "lucide-react";
import MovieCard from "../components/MovieCard";
import TmdbCredit from "../components/TmdbCredit";
import { useMyWatchlist } from "../lib/WatchlistContext";
import { useAuth } from "../auth/AuthProvider";
import { useRequireAuth } from "../components/AuthPrompt";
import { img, tmdb, yearOf, type Genre, type MovieSummary, type Page } from "../lib/tmdb";

const TABS = [
  ["trending", "Trending"], ["popular", "Popular"], ["top_rated", "Top rated"], ["now_playing", "In cinemas"], ["upcoming", "Coming soon"],
] as const;

type Mood = { label: string; emoji: string; blurb: string; genres: string; without?: string };
// TMDB has genres, not moods, so each mood combines genres (comma = both, pipe = either) and filters out the ones that don't fit.
const MOODS: Mood[] = [
  { label: "Cozy night", emoji: "🧸", blurb: "Light, feel-good comedies and family films. Nothing dark.", genres: "35|10751", without: "27,53,80,10752,9648,99" },
  { label: "Date night", emoji: "💞", blurb: "Romance, with the scary and violent stuff filtered out.", genres: "10749", without: "27,53,80,10752,99" },
  { label: "Spooky", emoji: "👻", blurb: "Proper horror. No comedies or kids' films.", genres: "27", without: "35,10751,16" },
  { label: "Make me laugh", emoji: "😂", blurb: "Pure comedies. Dark and serious genres are filtered out.", genres: "35", without: "27,53,80,10752,18,99" },
  { label: "Cry a little", emoji: "🥲", blurb: "Romantic dramas and tearjerkers.", genres: "18,10749", without: "35,27,28" },
  { label: "Mind-bending", emoji: "🌀", blurb: "Sci-fi mysteries that mess with your head.", genres: "878,9648" },
  { label: "Adventure", emoji: "🧭", blurb: "Quests, journeys and big escapes.", genres: "12", without: "27,99,10751,16" },
  { label: "Animated", emoji: "🎨", blurb: "Animation for every age.", genres: "16", without: "10770" },
];

const SORTS = { popular: "Most popular", rated: "Best rated", newest: "Newest" } as const;
type SortKey = keyof typeof SORTS;
const SORT_BY: Record<SortKey, string> = { popular: "popularity.desc", rated: "vote_average.desc", newest: "primary_release_date.desc" };
/** Filters that keep obscure or poorly-rated films out of the results. */
const quality = (s: SortKey, mood: boolean) => ({
  sort: SORT_BY[s],
  min_votes: s === "rated" ? 1500 : s === "newest" ? 150 : mood ? 300 : 50,
  min_rating: s === "rated" ? 7 : mood ? 6.2 : undefined,
});

function Hero({ movies }: { movies: MovieSummary[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const wl = useMyWatchlist();
  const { session } = useAuth();
  const requireAuth = useRequireAuth();

  useEffect(() => {
    if (paused || movies.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % movies.length), 7000);
    return () => clearInterval(t);
  }, [paused, movies.length]);

  const m = movies[i];
  if (!m) return <div className="skeleton h-72 rounded-sticker md:h-96" />;
  const bg = img(m.backdrop_path ?? null, "w1280");
  const poster = img(m.poster_path, "w342");
  const on = wl.has(m.id);
  const go = (d: number) => setI((x) => (x + d + movies.length) % movies.length);

  return (
    <section aria-label="Featured movies" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      className="relative flex min-h-[18rem] items-end overflow-hidden rounded-sticker border-2 border-foreground/15 bg-[#5A4650] text-white shadow-[4px_4px_0_#F9C6D8] md:min-h-[26rem]">
      {bg && <img key={m.id} src={bg} alt="" className="page-in absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-[#3b2b33]/95 via-[#3b2b33]/55 to-transparent md:bg-gradient-to-r md:from-[#3b2b33]/95 md:via-[#3b2b33]/60 md:to-transparent" />
      <div className="relative flex w-full items-end gap-6 p-5 md:p-8">
        {poster && <img src={poster} alt="" className="hidden w-36 shrink-0 rounded-xl border-4 border-card shadow-xl lg:block" />}
        <div className="max-w-xl">
          <p className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold">
            <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground">Trending now</span>
            {m.release_date && <span>{yearOf(m.release_date)}</span>}
            {m.vote_average > 0 && <span className="flex items-center gap-1"><Star size={14} className="fill-primary text-primary" />{m.vote_average.toFixed(1)}</span>}
          </p>
          <h2 className="font-heading text-3xl font-bold leading-tight md:text-5xl">{m.title}</h2>
          {m.overview && <p className="mt-2 line-clamp-2 text-white/85 md:line-clamp-3">{m.overview}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={`/app/movie/${m.id}`} className="btn-primary">View details</Link>
            {(wl.ready || !session) && (
              <button className="btn bg-card/90 text-foreground hover:bg-card" onClick={() => requireAuth("add movies to your watchlist") && wl.toggle(m.id)} disabled={wl.busy === m.id} aria-pressed={on}>
                {on ? <Check size={18} /> : <Plus size={18} />} {on ? "On my watchlist" : "Watchlist"}
              </button>
            )}
          </div>
        </div>
      </div>
      {movies.length > 1 && (
        <>
          <button aria-label="Previous movie" onClick={() => go(-1)} className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-card/80 p-2 text-foreground md:block"><ChevronLeft /></button>
          <button aria-label="Next movie" onClick={() => go(1)} className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-card/80 p-2 text-foreground md:block"><ChevronRight /></button>
          <div className="absolute right-4 top-4 flex gap-1.5">
            {movies.map((x, n) => (
              <button key={x.id} aria-label={`Show ${x.title}`} aria-current={n === i} onClick={() => setI(n)}
                className={`h-2.5 rounded-full transition-all ${n === i ? "w-6 bg-primary" : "w-2.5 bg-white/70"}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default function Discover() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("popular");
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("trending");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [hero, setHero] = useState<MovieSummary[]>([]);
  const [items, setItems] = useState<MovieSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [surprising, setSurprising] = useState(false);

  const searching = q.trim() !== "" || genre !== "" || year !== "";
  const yr = /^\d{4}$/.test(year) ? year : undefined;

  const source = useMemo<Record<string, unknown>>(() => {
    if (q.trim()) return { action: "search", query: q.trim(), year: yr };
    if (genre || yr) return { action: "discover", genre: genre || undefined, year: yr, ...quality(sort, false) };
    if (mood !== null) return { action: "discover", genre: MOODS[mood].genres, without_genres: MOODS[mood].without, ...quality(sort, true) };
    return { action: "list", kind: tab };
  }, [q, genre, yr, mood, tab, sort]);

  useEffect(() => {
    tmdb<Genre[]>({ action: "genres" }).then(setGenres).catch(() => {});
    tmdb<Page>({ action: "list", kind: "trending" })
      .then((p) => setHero(p.results.filter((m) => m.backdrop_path || m.poster_path).slice(0, 6)))
      .catch(() => {});
  }, []);

  const load = useCallback(async (p: number, append: boolean) => {
    setLoading(true);
    setError("");
    try {
      const res = await tmdb<Page>({ ...source, page: p });
      setItems((prev) => (append ? [...prev, ...res.results.filter((m) => !prev.some((x) => x.id === m.id))] : res.results));
      setPage(res.page);
      setTotalPages(res.total_pages);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, [source]);

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => { if (live) load(1, false); }, q ? 400 : 0);
    return () => { live = false; clearTimeout(t); };
  }, [load, q]);

  async function surprise() {
    setSurprising(true);
    try {
      const res = await tmdb<Page>({ action: "list", kind: "top_rated", page: 1 + Math.floor(Math.random() * 15) });
      const pick = res.results[Math.floor(Math.random() * res.results.length)];
      if (pick) navigate(`/app/movie/${pick.id}`);
    } catch (e) {
      setError((e as Error).message);
    }
    setSurprising(false);
  }

  const clear = () => { setQ(""); setGenre(""); setYear(""); setMood(null); };
  const heading = searching ? "Search results" : mood !== null ? `${MOODS[mood].emoji} ${MOODS[mood].label}` : TABS.find((t) => t[0] === tab)![1];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-3xl">Discover</h1>
        <div className="relative min-w-[14rem] flex-1 md:max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="input pl-11" placeholder="Search movies…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={genre} onChange={(e) => setGenre(e.target.value)} disabled={q.trim() !== ""} aria-label="Genre">
          <option value="">All genres</option>{genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <input className="input w-24" inputMode="numeric" maxLength={4} placeholder="Year" value={year}
          onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))} aria-label="Release year" />
        <button className="btn-primary" onClick={surprise} disabled={surprising}><Dices size={18} /> {surprising ? "Rolling…" : "Surprise me"}</button>
      </div>

      {!searching && <Hero movies={hero} />}

      {!searching && (
        <section aria-label="Pick a mood">
          <h2 className="mb-2 text-lg">What are you in the mood for?</h2>
          <div className="flex flex-wrap gap-2">
            {MOODS.map(({ label, emoji }, n) => (
              <button key={label} aria-pressed={mood === n} onClick={() => setMood(mood === n ? null : n)}
                className={`rounded-full border-2 px-4 py-2 font-heading font-bold transition ${
                  mood === n ? "border-berry bg-primary text-primary-foreground" : "border-border bg-card hover:-translate-y-0.5 hover:border-primary"}`}>
                <span aria-hidden>{emoji}</span> {label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="mr-2 text-2xl">{heading}</h2>
          {!searching && mood === null && (
            <div role="tablist" className="flex flex-wrap gap-1.5">
              {TABS.map(([k, label]) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                  className={tab === k ? "btn-primary !px-4 !py-1.5" : "btn-soft !px-4 !py-1.5"}>{label}</button>
              ))}
            </div>
          )}
          {(searching || mood !== null) && <button className="btn-soft !py-1.5" onClick={clear}><X size={16} /> Clear</button>}
          {source.action === "discover" && (
            <select className="input ml-auto w-auto !py-1.5" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort by">
              {(Object.keys(SORTS) as SortKey[]).map((k) => <option key={k} value={k}>{SORTS[k]}</option>)}
            </select>
          )}
        </div>
        {mood !== null && !searching && <p className="-mt-2 mb-4 text-muted-foreground">{MOODS[mood].blurb}</p>}

        {error && <p role="alert" className="mb-3 font-semibold text-destructive">Couldn't load movies: {error}</p>}

        <div className="poster-grid">
          {items.map((m) => <MovieCard key={m.id} movie={m} fluid />)}
          {loading && Array.from({ length: items.length ? 6 : 18 }).map((_, n) => (
            <div key={n}><div className="skeleton aspect-[2/3] rounded-xl" /><div className="skeleton mt-2 h-4 w-3/4 rounded" /></div>
          ))}
        </div>
        {!loading && items.length === 0 && !error && <p className="text-muted-foreground">No movies found. Try different words or filters.</p>}
        {!loading && page < totalPages && (
          <div className="mt-6 text-center"><button className="btn-soft" onClick={() => load(page + 1, true)}>Show more</button></div>
        )}
      </section>
      <TmdbCredit />
    </div>
  );
}
