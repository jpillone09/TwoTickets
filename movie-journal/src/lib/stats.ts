import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { fetchAll } from "./fetchAll";

export type EntryMovie = {
  id: number; title: string; poster_path: string | null; release_date: string | null; runtime: number | null;
  genres: { name: string }[]; director: string | null; cast_members: { name: string }[] | null;
};
export type Entry = {
  id: string; user_id: string; movie_id: number; watched_on: string; rating: number | null;
  is_rewatch: boolean; watched_together: boolean; movie: EntryMovie;
};
export type Rev = { movie_id: number; user_id: string; rating: number; movie: { id: number; title: string; poster_path: string | null } };

/** Loads every diary entry and rating you are allowed to see (yours and your partner's). */
export function useStatsData() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [reviews, setReviews] = useState<Rev[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [e, r, p] = await Promise.all([
          fetchAll<Entry>((a, b) => supabase.from("diary_entries")
            .select("id,user_id,movie_id,watched_on,rating,is_rewatch,watched_together,movie:movies(id,title,poster_path,release_date,runtime,genres,director,cast_members)")
            .order("watched_on", { ascending: false }).order("id").range(a, b)),
          fetchAll<Rev>((a, b) => supabase.from("reviews")
            .select("movie_id,user_id,rating,movie:movies(id,title,poster_path)").not("rating", "is", null).order("id").range(a, b)),
          supabase.from("profiles").select("id,display_name,username"),
        ]);
        setEntries(e);
        setReviews(r);
        setNames(Object.fromEntries((p.data ?? []).map((x) => [x.id as string, (x.display_name ?? x.username) as string])));
      } catch (err) {
        setError((err as Error).message);
      }
      setLoading(false);
    })();
  }, []);
  return { entries, reviews, names, loading, error };
}

export const topCounts = (arr: string[], n = 5): [string, number][] => {
  const m = new Map<string, number>();
  arr.forEach((a) => m.set(a, (m.get(a) ?? 0) + 1));
  return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
};

export const average = (nums: number[]) => (nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : null);
export const hoursOf = (entries: Entry[]) => Math.round((entries.reduce((s, e) => s + (e.movie.runtime ?? 0), 0) / 60) * 10) / 10;
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function streaks(dates: string[]) {
  const days = [...new Set(dates)].sort().map((d) => Date.parse(d + "T00:00:00Z") / 86400000);
  let longest = 0, run = 0;
  days.forEach((d, i) => { run = i > 0 && d - days[i - 1] === 1 ? run + 1 : 1; longest = Math.max(longest, run); });
  const today = Date.parse(new Date().toLocaleDateString("en-CA") + "T00:00:00Z") / 86400000;
  let current = 0;
  if (days.length && today - days[days.length - 1] <= 1) {
    current = 1;
    for (let i = days.length - 1; i > 0 && days[i] - days[i - 1] === 1; i--) current++;
  }
  return { longest, current };
}

export function summarize(list: Entry[]) {
  const uniq = new Map<number, EntryMovie>();
  list.forEach((e) => uniq.set(e.movie_id, e.movie));
  const movies = [...uniq.values()];
  const rated = list.filter((e) => e.rating !== null);

  const gr = new Map<string, { sum: number; n: number }>();
  rated.forEach((e) => e.movie.genres.forEach((g) => {
    const x = gr.get(g.name) ?? { sum: 0, n: 0 };
    gr.set(g.name, { sum: x.sum + (e.rating ?? 0), n: x.n + 1 });
  }));

  const byMonth = Array(12).fill(0) as number[];
  list.forEach((e) => { byMonth[Number(e.watched_on.slice(5, 7)) - 1]++; });
  const byYear = topCounts(list.map((e) => e.watched_on.slice(0, 4)), 100).sort((a, b) => a[0].localeCompare(b[0]));

  return {
    viewings: list.length,
    movies: movies.length,
    rewatches: list.filter((e) => e.is_rewatch).length,
    avg: average(rated.map((e) => e.rating ?? 0)),
    hours: hoursOf(list),
    genres: topCounts(movies.flatMap((m) => m.genres.map((g) => g.name)), 8),
    genreRatings: [...gr].filter(([, v]) => v.n >= 2).map(([k, v]) => [k, v.sum / v.n] as [string, number])
      .sort((a, b) => b[1] - a[1]).slice(0, 6),
    directors: topCounts(movies.flatMap((m) => (m.director ? m.director.split(", ") : [])), 5),
    actors: topCounts(movies.flatMap((m) => (m.cast_members ?? []).slice(0, 5).map((c) => c.name)), 5),
    ratingDist: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((v) => [String(v), rated.filter((e) => e.rating === v).length] as [string, number]),
    byMonth, byYear,
    ...streaks(list.map((e) => e.watched_on)),
  };
}
