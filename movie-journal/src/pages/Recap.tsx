import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { img } from "../lib/tmdb";
import { MONTHS, summarize, useStatsData } from "../lib/stats";
import { togetherViewings } from "./CoupleStats";

const COLORS = ["bg-secondary", "bg-accent", "bg-butter", "bg-secondary", "bg-accent", "bg-butter"];

export default function Recap() {
  const { session, profile } = useAuth();
  const uid = session!.user.id;
  const { entries, loading, error } = useStatsData();
  const thisYear = String(new Date().getFullYear());
  const [year, setYear] = useState(thisYear);

  const mine = useMemo(() => entries.filter((e) => e.user_id === uid), [entries, uid]);
  const years = useMemo(() => [...new Set([thisYear, ...mine.map((e) => e.watched_on.slice(0, 4))])].sort().reverse(), [mine, thisYear]);
  const list = useMemo(() => mine.filter((e) => e.watched_on.startsWith(year)), [mine, year]);
  const s = useMemo(() => summarize(list), [list]);
  const together = useMemo(() => togetherViewings(entries).filter((e) => e.watched_on.startsWith(year)).length, [entries, year]);

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p role="alert" className="font-semibold text-destructive">Couldn't load your recap: {error}</p>;

  const chrono = [...list].sort((a, b) => a.watched_on.localeCompare(b.watched_on));
  const best = [...list].filter((e) => e.rating !== null).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.watched_on.localeCompare(a.watched_on))[0];
  const counts = new Map<number, { n: number; title: string }>();
  list.forEach((e) => counts.set(e.movie_id, { n: (counts.get(e.movie_id)?.n ?? 0) + 1, title: e.movie.title }));
  const mostSeen = [...counts.values()].sort((a, b) => b.n - a.n)[0];
  const busiest = s.byMonth.indexOf(Math.max(...s.byMonth));

  const cards: [string, string, string?][] = list.length === 0 ? [] : [
    [`In ${year} you watched`, `${s.movies} movie${s.movies === 1 ? "" : "s"}`, `${s.hours} hours of movies`],
    ["Your top genre", s.genres[0]?.[0] ?? "–", s.genres[0] ? `${s.genres[0][1]} movies` : undefined],
    ["Busiest month", MONTHS[busiest], `${s.byMonth[busiest]} viewings`],
    ["Longest streak", `${s.longest} day${s.longest === 1 ? "" : "s"}`, "in a row"],
    ...(s.directors[0] ? [["Favorite director", s.directors[0][0], `${s.directors[0][1]} of their movies`] as [string, string, string]] : []),
    ...(mostSeen && mostSeen.n > 1 ? [["Most rewatched", mostSeen.title, `${mostSeen.n} times`] as [string, string, string]] : []),
    ...(profile?.couple_id ? [["Watched together", `${together}`, "movie nights"] as [string, string, string]] : []),
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Your {year} recap</h1>
        <select className="input w-auto" value={year} onChange={(e) => setYear(e.target.value)} aria-label="Year">
          {years.map((y) => <option key={y}>{y}</option>)}
        </select>
      </div>

      {list.length === 0 && (
        <div className="sticker-card p-8 text-center text-muted-foreground">
          Nothing logged in {year} yet. <Link to="/app/discover" className="font-bold text-berry underline">Find a movie</Link> to get started.
        </div>
      )}

      {cards.map(([label, big, small], i) => (
        <div key={label} className={`sticker-card ${COLORS[i % COLORS.length]} p-8 text-center`}>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="my-1 font-heading text-4xl font-bold text-berry md:text-5xl">{big}</p>
          {small && <p className="text-muted-foreground">{small}</p>}
        </div>
      ))}

      {best && (
        <div className="sticker-card flex items-center gap-4 p-6">
          {best.movie.poster_path && <img src={img(best.movie.poster_path, "w185")!} alt="" className="w-24 rounded-xl border-4 border-card shadow" />}
          <div><p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your top-rated movie</p>
            <Link to={`/app/movie/${best.movie_id}`} className="font-heading text-2xl font-bold text-berry">{best.movie.title}</Link>
            <p className="text-muted-foreground">{best.rating} ★</p></div>
        </div>
      )}

      {chrono.length > 1 && (
        <div className="sticker-card p-6 text-center">
          <p className="text-muted-foreground">You started the year with</p>
          <Link to={`/app/movie/${chrono[0].movie_id}`} className="font-heading text-xl font-bold">{chrono[0].movie.title}</Link>
          <p className="mt-3 text-muted-foreground">and your latest was</p>
          <Link to={`/app/movie/${chrono[chrono.length - 1].movie_id}`} className="font-heading text-xl font-bold">{chrono[chrono.length - 1].movie.title}</Link>
        </div>
      )}
    </div>
  );
}
