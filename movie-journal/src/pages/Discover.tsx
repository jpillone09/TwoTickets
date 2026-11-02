import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import MovieCard from "../components/MovieCard";
import TmdbCredit from "../components/TmdbCredit";
import { tmdb, type Genre, type MovieSummary, type Page } from "../lib/tmdb";

const ROWS = [
  ["trending", "Trending this week"],
  ["popular", "Popular"],
  ["top_rated", "Top rated"],
  ["upcoming", "Coming soon"],
] as const;

export default function Discover() {
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [rows, setRows] = useState<Record<string, MovieSummary[]>>({});
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const reqId = useRef(0);

  const searching = q.trim() !== "" || genre !== "" || year !== "";

  useEffect(() => {
    Promise.all([
      tmdb<Genre[]>({ action: "genres" }),
      ...ROWS.map(([kind]) => tmdb<Page>({ action: "list", kind })),
    ])
      .then(([g, ...lists]) => {
        setGenres(g as Genre[]);
        setRows(Object.fromEntries(ROWS.map(([kind], i) => [kind, (lists[i] as Page).results])));
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  const run = useCallback(async (p: number, append: boolean) => {
    const id = ++reqId.current;
    setLoading(true);
    setError("");
    try {
      const yr = /^\d{4}$/.test(year) ? year : undefined;
      const res = await tmdb<Page>(
        q.trim()
          ? { action: "search", query: q.trim(), year: yr, page: p }
          : { action: "discover", genre: genre || undefined, year: yr, page: p },
      );
      if (id !== reqId.current) return; // a newer request replaced this one
      setResults((prev) => (append ? [...prev, ...res.results] : res.results));
      setPage(res.page);
      setTotalPages(res.total_pages);
    } catch (e) {
      if (id === reqId.current) setError((e as Error).message);
    }
    if (id === reqId.current) setLoading(false);
  }, [q, genre, year]);

  useEffect(() => {
    if (!searching) return;
    const t = setTimeout(() => run(1, false), 400);
    return () => clearTimeout(t);
  }, [searching, run]);

  const clear = () => { setQ(""); setGenre(""); setYear(""); setResults([]); };

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl">Discover</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="input pl-11" placeholder="Search movies…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={genre} onChange={(e) => setGenre(e.target.value)} disabled={q.trim() !== ""}
          aria-label="Genre">
          <option value="">All genres</option>
          {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <input className="input w-28" inputMode="numeric" maxLength={4} placeholder="Year" value={year}
          onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))} aria-label="Release year" />
        {searching && <button className="btn-soft" onClick={clear}><X size={16} /> Clear</button>}
      </div>

      {error && <p role="alert" className="mt-4 font-semibold text-destructive">Couldn't load movies: {error}</p>}

      {searching ? (
        <>
          <div className="mt-6 flex flex-wrap gap-5">
            {results.map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
          {!loading && results.length === 0 && !error && <p className="mt-6 text-muted-foreground">No movies found.</p>}
          {loading && <p className="mt-6 text-muted-foreground">Loading…</p>}
          {!loading && page < totalPages && (
            <button className="btn-soft mt-6" onClick={() => run(page + 1, true)}>Show more</button>
          )}
        </>
      ) : (
        ROWS.map(([kind, title]) => (
          <section key={kind} className="mt-8">
            <h2 className="mb-3 text-xl">{title}</h2>
            <div className="flex gap-4 overflow-x-auto pb-3">
              {(rows[kind] ?? []).map((m) => <MovieCard key={m.id} movie={m} />)}
              {!rows[kind] && !error && <p className="text-muted-foreground">Loading…</p>}
            </div>
          </section>
        ))
      )}
      <TmdbCredit />
    </div>
  );
}
