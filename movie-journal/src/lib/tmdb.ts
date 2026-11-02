import { supabase } from "./supabase";

export type Genre = { id: number; name: string };
export type MovieSummary = {
  id: number; title: string; poster_path: string | null; release_date: string | null; vote_average: number;
};
export type Page = { results: MovieSummary[]; page: number; total_pages: number };
export type CastMember = { id: number; name: string; character: string; profile_path: string | null };
export type Movie = {
  id: number; title: string; overview: string | null; poster_path: string | null; backdrop_path: string | null;
  release_date: string | null; runtime: number | null; genres: Genre[]; director: string | null;
  cast_members: CastMember[]; tmdb_rating: number | null;
};

export async function tmdb<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("tmdb", { body });
  if (error) {
    // Show the real reason instead of the generic "non-2xx" message
    let msg = error.message;
    const res = (error as { context?: Response }).context;
    if (res && typeof res.json === "function") {
      try {
        const b = await res.json();
        msg = `${res.status}: ${b.error ?? b.message ?? JSON.stringify(b)}`;
      } catch {
        msg = `${res.status}: ${error.message}`;
      }
    }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export const img = (path: string | null, size: "w185" | "w342" | "w500" | "w1280" = "w342") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

export const yearOf = (d: string | null) => (d ? d.slice(0, 4) : "");
