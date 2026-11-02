import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Grid2x2, List, Repeat, Trash2, Users } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { Stars } from "../components/StarRating";
import { img, yearOf } from "../lib/tmdb";
import { fmtDate } from "../lib/types";

type Entry = {
  id: string; watched_on: string; rating: number | null; is_rewatch: boolean; watched_together: boolean; notes: string | null;
  movie: { id: number; title: string; poster_path: string | null; release_date: string | null; genres: { id: number; name: string }[] };
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Diary() {
  const { session } = useAuth();
  const uid = session!.user.id;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "grid">("list");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [genre, setGenre] = useState("");
  const [minRating, setMinRating] = useState("");
  const [rewatchOnly, setRewatchOnly] = useState(false);
  const [togetherOnly, setTogetherOnly] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("diary_entries")
      .select("id,watched_on,rating,is_rewatch,watched_together,notes,movie:movies(id,title,poster_path,release_date,genres)")
      .eq("user_id", uid).order("watched_on", { ascending: false }).order("created_at", { ascending: false }).limit(1000);
    setEntries((data ?? []) as unknown as Entry[]);
    setLoading(false);
  }, [uid]);
  useEffect(() => { load(); }, [load]);

  const years = useMemo(() => [...new Set(entries.map((e) => e.watched_on.slice(0, 4)))], [entries]);
  const genres = useMemo(() => [...new Set(entries.flatMap((e) => e.movie.genres.map((g) => g.name)))].sort(), [entries]);

  const shown = entries.filter((e) =>
    (!year || e.watched_on.startsWith(year)) &&
    (!month || e.watched_on.slice(5, 7) === month) &&
    (!genre || e.movie.genres.some((g) => g.name === genre)) &&
    (!minRating || (e.rating ?? 0) >= Number(minRating)) &&
    (!rewatchOnly || e.is_rewatch) && (!togetherOnly || e.watched_together));

  async function remove(id: string) {
    if (!confirm("Delete this diary entry?")) return;
    await supabase.from("diary_entries").delete().eq("id", id);
    load();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Diary</h1>
        <div className="flex gap-2">
          <button aria-label="List view" className={view === "list" ? "btn-primary !px-3" : "btn-soft !px-3"} onClick={() => setView("list")}><List size={18} /></button>
          <button aria-label="Poster grid" className={view === "grid" ? "btn-primary !px-3" : "btn-soft !px-3"} onClick={() => setView("grid")}><Grid2x2 size={18} /></button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <select className="input w-auto" value={year} onChange={(e) => setYear(e.target.value)} aria-label="Year">
          <option value="">All years</option>{years.map((y) => <option key={y}>{y}</option>)}
        </select>
        <select className="input w-auto" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month">
          <option value="">All months</option>{MONTHS.map((m, i) => <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>)}
        </select>
        <select className="input w-auto" value={genre} onChange={(e) => setGenre(e.target.value)} aria-label="Genre">
          <option value="">All genres</option>{genres.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select className="input w-auto" value={minRating} onChange={(e) => setMinRating(e.target.value)} aria-label="Minimum rating">
          <option value="">Any rating</option>{[2, 3, 3.5, 4, 4.5, 5].map((r) => <option key={r} value={r}>{r}+ stars</option>)}
        </select>
        <label className="flex items-center gap-1 font-semibold"><input type="checkbox" checked={rewatchOnly} onChange={(e) => setRewatchOnly(e.target.checked)} /> Rewatches</label>
        <label className="flex items-center gap-1 font-semibold"><input type="checkbox" checked={togetherOnly} onChange={(e) => setTogetherOnly(e.target.checked)} /> Together</label>
      </div>

      {loading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      {!loading && shown.length === 0 && (
        <p className="mt-6 text-muted-foreground">
          {entries.length ? "Nothing matches these filters." : "Your diary is empty. Open a movie in Discover and tap “Log a viewing”."}
        </p>
      )}

      {view === "list" ? (
        <div className="mt-5 space-y-3">
          {shown.map((e) => (
            <div key={e.id} className="sticker-card flex items-center gap-4 p-3">
              <span className="w-16 shrink-0 text-center text-sm font-bold text-berry">{fmtDate(e.watched_on)}</span>
              <Link to={`/app/movie/${e.movie.id}`} className="w-12 shrink-0">
                {e.movie.poster_path && <img src={img(e.movie.poster_path, "w185")!} alt="" className="rounded-md border-2 border-white shadow" />}
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/app/movie/${e.movie.id}`} className="font-heading font-bold">
                  {e.movie.title} <span className="font-body font-normal text-muted-foreground">{yearOf(e.movie.release_date)}</span>
                </Link>
                <div className="flex flex-wrap items-center gap-2"><Stars value={e.rating} size={16} />
                  {e.is_rewatch && <span className="chip flex items-center gap-1"><Repeat size={12} />Rewatch</span>}
                  {e.watched_together && <span className="chip flex items-center gap-1 !bg-accent"><Users size={12} />Together</span>}
                </div>
                {e.notes && <p className="mt-1 text-sm text-muted-foreground">{e.notes}</p>}
              </div>
              <button aria-label="Delete entry" onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-5">
          {shown.map((e) => (
            <Link key={e.id} to={`/app/movie/${e.movie.id}`} className="w-32">
              {e.movie.poster_path
                ? <img src={img(e.movie.poster_path)!} alt={e.movie.title} className="aspect-[2/3] rounded-xl border-4 border-white object-cover shadow-md" />
                : <div className="flex aspect-[2/3] items-center justify-center rounded-xl bg-secondary p-2 text-center text-sm">{e.movie.title}</div>}
              <div className="mt-1"><Stars value={e.rating} size={14} /></div>
              <p className="text-xs text-muted-foreground">{fmtDate(e.watched_on)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
