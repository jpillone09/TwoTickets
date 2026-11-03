import { supabase } from "./supabase";
import { fetchAll } from "./fetchAll";

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
const stamp = () => new Date().toISOString().slice(0, 10);
const csvCell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // stop spreadsheet formula injection
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

type Row = { watched_on: string; rating: number | null; is_rewatch: boolean; watched_together: boolean; notes: string | null; movie: { title: string; release_date: string | null } };

export async function exportDiaryCsv(uid: string) {
  const rows = await fetchAll<Row>((a, b) => supabase.from("diary_entries")
    .select("watched_on,rating,is_rewatch,watched_together,notes,movie:movies(title,release_date)")
    .eq("user_id", uid).order("watched_on").order("id").range(a, b));
  const lines = [["Date", "Title", "Year", "Rating", "Rewatch", "Together", "Notes"].join(",")];
  rows.forEach((r) => lines.push([r.watched_on, r.movie.title, r.movie.release_date?.slice(0, 4), r.rating, r.is_rewatch ? "yes" : "no",
    r.watched_together ? "yes" : "no", r.notes].map(csvCell).join(",")));
  download(`diary-${stamp()}.csv`, lines.join("\n"), "text/csv");
}

export async function exportAllJson(uid: string) {
  const table = (name: string, select: string, col: string) =>
    fetchAll<unknown>((a, b) => supabase.from(name).select(select).eq(col, uid).order(col).range(a, b));
  const [profile, diary, reviews, favorites, lists, watchlist, sent, received] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle().then((r) => r.data),
    table("diary_entries", "*, movie:movies(id,title)", "user_id"),
    table("reviews", "*, movie:movies(id,title)", "user_id"),
    table("favorite_movies", "*, movie:movies(id,title)", "user_id"),
    table("movie_lists", "*, items:movie_list_items(movie_id,movie:movies(title))", "user_id"),
    table("watchlist_movies", "*, movie:movies(id,title)", "added_by"),
    table("recommendations", "*, movie:movies(id,title)", "sender_id"),
    table("recommendations", "*, movie:movies(id,title)", "recipient_id"),
  ]);
  const out = { exported_at: new Date().toISOString(), profile, diary, reviews, favorites, lists, watchlist_additions: watchlist, recommendations_sent: sent, recommendations_received: received };
  download(`my-movie-data-${stamp()}.json`, JSON.stringify(out, null, 2), "application/json");
}
