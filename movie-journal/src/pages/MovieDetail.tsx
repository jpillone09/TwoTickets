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
import type { ReviewRow } from "../lib/types";
import { img, tmdb, yearOf, type Movie, type MovieSummary, type Page } from "../lib/tmdb";

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [similar, setSimilar] = useState<MovieSummary[]>([]);
  const [error, setError] = useState("");
  const { session, profile } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [views, setViews] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const loadMine = useCallback(async () => {
    if (!id || !session) return;
    const [r, d] = await Promise.all([
      supabase.from("reviews").select("*, author:profiles(id,display_name,username)").eq("movie_id", Number(id)).order("created_at"),
      supabase.from("diary_entries").select("id", { count: "exact", head: true }).eq("movie_id", Number(id)).eq("user_id", session.user.id),
    ]);
    setReviews((r.data ?? []) as unknown as ReviewRow[]);
    setViews(d.count ?? 0);
  }, [id, session]);
  useEffect(() => { loadMine(); }, [loadMine]);
  const myReview = reviews.find((r) => r.user_id === session?.user.id) ?? null;

  useEffect(() => {
    setMovie(null);
    setSimilar([]);
    setError("");
    tmdb<Movie>({ action: "movie", id }).then(setMovie).catch((e) => setError((e as Error).message));
    tmdb<Page>({ action: "similar", id }).then((p) => setSimilar(p.results)).catch(() => {});
  }, [id]);

  if (error) return <p role="alert" className="font-semibold text-destructive">Couldn't load this movie: {error}</p>;
  if (!movie) return <p className="text-muted-foreground">Loading…</p>;

  const backdrop = img(movie.backdrop_path, "w1280");
  const poster = img(movie.poster_path, "w500");

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/app/discover" className="mb-3 inline-flex items-center gap-1 font-semibold text-berry">
        <ArrowLeft size={18} /> Back to Discover
      </Link>

      <div className="sticker-card overflow-hidden">
        {backdrop && (
          <div className="h-40 bg-secondary md:h-72">
            <img src={backdrop} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex flex-col gap-6 p-6 md:flex-row">
          {poster && (
            <img src={poster} alt={`${movie.title} poster`}
              className={`w-40 shrink-0 self-start rounded-xl border-4 border-white shadow-md md:w-56 ${backdrop ? "-mt-24 md:-mt-32" : ""}`} />
          )}
          <div className="flex-1">
            <h1 className="text-3xl">
              {movie.title} <span className="font-body text-xl font-normal text-muted-foreground">{yearOf(movie.release_date)}</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              {movie.tmdb_rating && (
                <span className="chip flex items-center gap-1"><Star size={14} className="fill-primary text-primary" />{movie.tmdb_rating} TMDB</span>
              )}
              {movie.runtime && <span className="chip flex items-center gap-1"><Clock size={14} />{movie.runtime} min</span>}
              {movie.genres.map((g) => <span key={g.id} className="chip">{g.name}</span>)}
            </div>
            {movie.director && <p className="mt-3 text-sm text-muted-foreground">Directed by <b className="text-foreground">{movie.director}</b></p>}
            <p className="mt-4 leading-relaxed">{movie.overview ?? "No synopsis available."}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
                {showForm ? "Close" : myReview || views > 0 ? "Log again / edit review" : "Log a viewing"}
              </button>
              {views > 0 && <span className="text-sm text-muted-foreground">You've logged this {views} time{views > 1 ? "s" : ""}.</span>}
            </div>
            <SaveButtons movieId={movie.id} paired={!!profile?.couple_id} />
            <MovieActions movie={{ id: movie.id, title: movie.title }} paired={!!profile?.couple_id} />
            {showForm && (
              <LogForm movie={{ id: movie.id, title: movie.title }} existing={myReview} priorViews={views}
                paired={!!profile?.couple_id} onSaved={() => { setShowForm(false); loadMine(); }} />
            )}
          </div>
        </div>
      </div>

      {reviews.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl">Ratings &amp; reviews</h2>
          <div className="space-y-4">
            {reviews.map((r) => <ReviewCard key={r.id} review={r} onChanged={loadMine} />)}
          </div>
        </section>
      )}

      {movie.cast_members.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl">Cast</h2>
          <div className="flex gap-4 overflow-x-auto pb-3">
            {movie.cast_members.map((c) => {
              const p = img(c.profile_path, "w185");
              return (
                <div key={c.id} className="w-28 shrink-0 text-center">
                  {p ? (
                    <img src={p} alt={c.name} loading="lazy" className="mx-auto h-28 w-28 rounded-full border-4 border-white object-cover shadow" />
                  ) : (
                    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-secondary"><UserRound className="text-primary" /></div>
                  )}
                  <p className="mt-2 text-sm font-bold leading-tight">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.character}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl">Similar movies</h2>
          <div className="flex gap-4 overflow-x-auto pb-3">
            {similar.slice(0, 12).map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
        </section>
      )}
      <TmdbCredit />
    </div>
  );
}
