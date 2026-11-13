import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { BarList, Section, StatCard } from "../components/Charts";
import { Stars } from "../components/StarRating";
import { img } from "../lib/tmdb";
import { average, hoursOf, summarize, useStatsData, type Entry } from "../lib/stats";

/** One shared viewing = a movie on a day where either of you ticked "watched together". */
export function togetherViewings(entries: Entry[]) {
  const seen = new Map<string, Entry>();
  entries.filter((e) => e.watched_together).forEach((e) => { if (!seen.has(`${e.movie_id}|${e.watched_on}`)) seen.set(`${e.movie_id}|${e.watched_on}`, e); });
  return [...seen.values()];
}

export default function CoupleStats() {
  const { session, profile } = useAuth();
  const uid = session!.user.id;
  const { entries, reviews, names, loading, error } = useStatsData();

  const data = useMemo(() => {
    const together = togetherViewings(entries);
    const year = String(new Date().getFullYear());
    const sum = summarize(together);
    const partnerId = Object.keys(names).find((id) => id !== uid) ?? "";
    const byMovie = new Map<number, { title: string; poster: string | null; mine?: number; theirs?: number }>();
    reviews.forEach((r) => {
      const x = byMovie.get(r.movie_id) ?? { title: r.movie.title, poster: r.movie.poster_path };
      if (r.user_id === uid) x.mine = r.rating; else x.theirs = r.rating;
      byMovie.set(r.movie_id, x);
    });
    const both = [...byMovie.entries()].filter(([, v]) => v.mine !== undefined && v.theirs !== undefined)
      .map(([id, v]) => ({ id, ...v, mine: v.mine!, theirs: v.theirs!, avg: (v.mine! + v.theirs!) / 2, diff: Math.abs(v.mine! - v.theirs!) }));
    return {
      together, sum, partnerId, both,
      thisYear: together.filter((e) => e.watched_on.startsWith(year)).length,
      hours: hoursOf(together),
      shared: average(both.map((b) => b.avg)),
      myAvg: average(reviews.filter((r) => r.user_id === uid).map((r) => r.rating)),
      theirAvg: average(reviews.filter((r) => r.user_id !== uid).map((r) => r.rating)),
      best: [...both].sort((a, b) => b.avg - a.avg || b.mine - a.mine).slice(0, 5),
      disagree: both.filter((b) => b.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 5),
    };
  }, [entries, reviews, names, uid]);

  if (profile && !profile.couple_id)
    return (
      <div className="sticker-card mx-auto mt-10 max-w-lg p-8 text-center">
        <h1 className="text-2xl">Our stats</h1>
        <p className="mt-2 text-muted-foreground">Pair up with your partner to see what you watch and rate together.</p>
        <Link to="/onboarding" className="btn-primary mt-5">Pair up</Link>
      </div>
    );
  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p role="alert" className="font-semibold text-destructive">Couldn't load stats: {error}</p>;

  const partnerName = names[data.partnerId] ?? "Partner";
  const f = (n: number | null) => (n === null ? "–" : n.toFixed(2));

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <h1 className="text-3xl">Our stats</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Watched together" value={data.together.length} />
        <StatCard label="Hours together" value={data.hours} />
        <StatCard label="Together this year" value={data.thisYear} />
        <StatCard label="Shared average" value={f(data.shared)} hint={`${data.both.length} rated by both`} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Section title="Most-watched genres together"><BarList items={data.sum.genres} empty='Tick "Watched together" when you log a movie.' /></Section>
        <Section title="Average ratings">
          <BarList items={[["You", data.myAvg ?? 0, f(data.myAvg) + " ★"], [partnerName, data.theirAvg ?? 0, f(data.theirAvg) + " ★"]]} />
        </Section>
      </div>

      <Section title="Your highest-rated movies">
        {data.best.length === 0 ? <p className="text-sm text-muted-foreground">Once you both rate the same movie, it'll show up here.</p> : (
          <ol className="space-y-2">
            {data.best.map((b) => (
              <li key={b.id}><Link to={`/app/movie/${b.id}`} className="flex items-center gap-3">
                {b.poster && <img src={img(b.poster, "w185")!} alt="" className="w-10 rounded-md border-2 border-card" />}
                <span className="flex-1 font-semibold">{b.title}</span><Stars value={b.avg} size={16} /><span className="w-10 text-right text-sm">{b.avg.toFixed(1)}</span>
              </Link></li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="Biggest disagreements">
        {data.disagree.length === 0 ? <p className="text-sm text-muted-foreground">No disagreements yet. Impressive!</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th className="py-1">Movie</th><th>You</th><th>{partnerName}</th><th>Gap</th></tr></thead>
              <tbody>
                {data.disagree.map((b) => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="py-2 font-semibold"><Link to={`/app/movie/${b.id}`}>{b.title}</Link></td>
                    <td>{b.mine}★</td><td>{b.theirs}★</td><td><span className="chip !bg-butter">{b.diff}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Rating comparison (all movies you both rated)">
        {data.both.length === 0 ? <p className="text-sm text-muted-foreground">Nothing to compare yet.</p> : (
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th className="py-1">Movie</th><th>You</th><th>{partnerName}</th></tr></thead>
              <tbody>{data.both.sort((a, b) => a.title.localeCompare(b.title)).map((b) => (
                <tr key={b.id} className="border-t border-border"><td className="py-1.5"><Link to={`/app/movie/${b.id}`}>{b.title}</Link></td><td>{b.mine}★</td><td>{b.theirs}★</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
