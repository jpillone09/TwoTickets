import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Star, UserRound } from "lucide-react";
import MovieCard from "../components/MovieCard";
import TmdbCredit from "../components/TmdbCredit";
import LogForm from "../components/LogForm";
import SaveButtons from "../components/SaveButtons";
import MovieActions from "../components/MovieActions";
import ReviewCard from "../components/ReviewCard";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import { img, tmdb, yearOf, type Movie, type MovieSummary, type Page } from "../lib/tmdb";
import type { ReviewRow } from "../lib/types";

export default function MovieDetail() {
  const { id } = useParams();
  const { session, profile, partner } = useAuth();
  const uid = session!.user.id;
  const [movie, setMovie] = useState<Movie | null>(null);
  const [similar, setSimilar] = useState<MovieSummary[]>([]);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [views, setViews] = useState(0);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setMovie(null); setSimilar([]); setError(""); setShowForm(false);
    tmdb<Movie>({ action: "movie", id }).then(setMovie).catch((e) => setError((e as Error).message));
    tmdb<Page>({ action: "similar", id }).then((p) => setSimilar(p.results)).catch(() => {});
  }, [id]);

  const loadMine = useCallback(async () => {
    if (!id) return;
    const [r, d] = await Promise.all([
      supabase.from("reviews").select("*, author:profiles(id,display_name,username)").eq("movie_id", Number(id)).order("created_at"),
      supabase.from("diary_entries").select("id", { count: "exact", head: true }).eq("movie_id", Number(id)).eq("user_id", uid),
    ]);
    setReviews((r.data ?? []) as unknown as ReviewRow[]);
    setViews(d.count ?? 0);
  }, [id, uid]);
  useEffect(() => { loadMine(); }, [loadMine]);

  if (error) return <p role="alert" className="font-semibold text-destructive">Couldn't load this movie: {error}</p>;
  if (!movie) return (
    <div className="mx-auto max-w-5xl space-y-4"><div className="skeleton h-72 rounded-sticker" /><div className="skeleton h-40 rounded-sticker" /></div>
  );

  const myReview = reviews.find((r) => r.user_id === uid) ?? null;
  const partnerReview = reviews.find((r) => r.user_id !== uid) ?? null;
  const backdrop = img(movie.backdrop_path, "w1280");
  const poster = img(movie.poster_path, "w500");
  const partnerName = partner?.display_name ?? partner?.username ?? "Your partner";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link to="/app/discover" className="inline-flex items-center gap-1 font-semibold text-berry"><ArrowLeft size={18} /> Back to Discover</Link>

      <div className="sticker-card overflow-hidden">
        <div className="relative h-44 bg-[#5A4650] md:h-80">
          {backdrop && <img src={backdrop} alt="" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        </div>
        <div className="flex flex-col gap-6 p-6 md:flex-row">
          {poster && <img src={poster} alt={`${movie.title} poster`} className="-mt-28 w-40 shrink-0 self-start rounded-xl border-4 border-white shadow-xl md:-mt-40 md:w-56" />}
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl md:text-4xl">{movie.title} <span className="font-body text-xl font-normal text-muted-foreground">{yearOf(movie.release_date)}</span></h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              {movie.tmdb_rating && <span className="chip flex items-center gap-1"><Star size={14} className="fill-primary text-primary" />{movie.tmdb_rating} TMDB</span>}
              {movie.runtime && <span className="chip flex items-center gap-1"><Clock size={14} />{movie.runtime} min</span>}
              {movie.genres.map((g) => <span key={g.id} className="chip !bg-accent">{g.name}</span>)}
            </div>
            {movie.director && <p className="mt-3 text-sm text-muted-foreground">Directed by <b className="text-foreground">{movie.director}</b></p>}
            <p className="mt-4 leading-relaxed">{movie.overview ?? "No synopsis available."}</p>

            <div className="mt-5 rounded-sticker bg-secondary/60 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
                  {showForm ? "Close" : myReview || views > 0 ? "Log again / edit review" : "Log a viewing"}
                </button>
                {views > 0 && <span className="text-sm text-muted-foreground">You've logged this {views} time{views > 1 ? "s" : ""}.</span>}
              </div>
              <SaveButtons movieId={movie.id} paired={!!profile?.couple_id} />
              <MovieActions movie={{ id: movie.id, title: movie.title }} paired={!!partner} />
            </div>
            {showForm && (
              <LogForm movie={{ id: movie.id, title: movie.title }} existing={myReview} priorViews={views}
                paired={!!profile?.couple_id} onSaved={() => { setShowForm(false); loadMine(); }} />
            )}
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-xl">Ratings &amp; reviews</h2>
        <div className={`grid gap-4 ${profile?.couple_id ? "md:grid-cols-2" : ""}`}>
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-berry">You</p>
            {myReview ? <ReviewCard review={myReview} onChanged={loadMine} /> : (
              <div className="sticker-card p-5 text-muted-foreground">
                You haven't rated this yet. <button className="font-bold text-berry underline" onClick={() => setShowForm(true)}>Rate it</button>
              </div>
            )}
          </div>
          {profile?.couple_id && (
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-wide text-berry">{partner ? partnerName : "Your partner"}</p>
              {partnerReview ? <ReviewCard review={partnerReview} onChanged={loadMine} /> : (
                <div className="sticker-card p-5 text-muted-foreground">
                  {partner ? `${partnerName} hasn't rated this yet.` : "Your partner hasn't joined yet. Once they do, their rating will show here."}
                </div>
              )}
            </div>
          )}
        </div>
        {!profile?.couple_id && <p className="mt-3 text-sm text-muted-foreground"><Link to="/onboarding" className="font-bold text-berry underline">Pair up</Link> to see your partner's ratings here.</p>}
      </section>

      {movie.cast_members.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl">Cast</h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(7rem, 1fr))" }}>
            {movie.cast_members.map((c) => {
              const p = img(c.profile_path, "w185");
              return (
                <div key={c.id} className="text-center">
                  {p ? <img src={p} alt={c.name} loading="lazy" className="mx-auto h-24 w-24 rounded-full border-4 border-white object-cover shadow" />
                    : <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-secondary"><UserRound className="text-primary" /></div>}
                  <p className="mt-2 text-sm font-bold leading-tight">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.character}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl">Similar movies</h2>
          <div className="poster-grid">{similar.slice(0, 12).map((m) => <MovieCard key={m.id} movie={m} fluid />)}</div>
        </section>
      )}
      <TmdbCredit />
    </div>
  );
}
