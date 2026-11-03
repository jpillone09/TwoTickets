import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { BarList, Columns, Section, StatCard } from "../components/Charts";
import { MONTHS, summarize, useStatsData } from "../lib/stats";

export default function Stats() {
  const { session } = useAuth();
  const uid = session!.user.id;
  const { entries, loading, error } = useStatsData();
  const [year, setYear] = useState("all");

  const mine = useMemo(() => entries.filter((e) => e.user_id === uid), [entries, uid]);
  const years = useMemo(() => [...new Set(mine.map((e) => e.watched_on.slice(0, 4)))].sort().reverse(), [mine]);
  const list = useMemo(() => (year === "all" ? mine : mine.filter((e) => e.watched_on.startsWith(year))), [mine, year]);
  const s = useMemo(() => summarize(list), [list]);

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p role="alert" className="font-semibold text-destructive">Couldn't load stats: {error}</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Your stats</h1>
        <div className="flex gap-2">
          <select className="input w-auto" value={year} onChange={(e) => setYear(e.target.value)} aria-label="Year">
            <option value="all">All time</option>{years.map((y) => <option key={y}>{y}</option>)}
          </select>
          <Link to="/app/stats/recap" className="btn-primary"><Sparkles size={16} /> Yearly recap</Link>
        </div>
      </div>

      {mine.length === 0 ? (
        <div className="sticker-card p-8 text-center text-muted-foreground">
          No data yet. Log a few movies from <Link to="/app/discover" className="font-bold text-berry underline">Discover</Link> and your stats will appear here.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatCard label="Movies watched" value={s.movies} hint={`${s.viewings} viewings`} />
            <StatCard label="Hours watched" value={s.hours} />
            <StatCard label="Average rating" value={s.avg ? s.avg.toFixed(2) : "–"} />
            <StatCard label="Rewatches" value={s.rewatches} />
            <StatCard label="Longest streak" value={`${s.longest} d`} hint="days in a row" />
            <StatCard label="Current streak" value={`${s.current} d`} />
          </div>

          <Section title={year === "all" ? "Movies per year" : `Movies per month in ${year}`}>
            <Columns data={year === "all" ? s.byYear : MONTHS.map((m, i) => [m, s.byMonth[i]] as [string, number])} />
          </Section>

          <div className="grid gap-5 md:grid-cols-2">
            <Section title="Most-watched genres"><BarList items={s.genres} /></Section>
            <Section title="Highest-rated genres">
              <BarList items={s.genreRatings.map(([k, v]) => [k, v, v.toFixed(2) + " ★"])} empty="Rate at least two movies in a genre." />
            </Section>
            <Section title="Favorite directors"><BarList items={s.directors} /></Section>
            <Section title="Favorite actors"><BarList items={s.actors} /></Section>
          </div>

          <Section title="How you rate"><Columns data={s.ratingDist} /></Section>
        </>
      )}
    </div>
  );
}
