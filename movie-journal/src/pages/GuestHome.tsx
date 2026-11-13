import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import { tmdb, type MovieSummary, type Page } from "../lib/tmdb";
import { APP_NAME } from "../lib/brand";

export default function GuestHome() {
  const [movies, setMovies] = useState<MovieSummary[]>([]);
  useEffect(() => {
    tmdb<Page>({ action: "list", kind: "trending" }).then((p) => setMovies(p.results.slice(0, 12))).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="ticket px-8 py-8 text-center md:text-left">
        <p className="text-xs font-bold uppercase tracking-widest text-berry">Admit one + one</p>
        <h1 className="mt-1 text-3xl md:text-4xl">Welcome to {APP_NAME}</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Look around as much as you like. Create a free account when you want to log movies, rate them and share a watchlist with your partner.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
          <Link to="/signup" className="btn-primary">Sign up free</Link>
          <Link to="/login" className="btn-soft">Log in</Link>
          <Link to="/app/discover" className="btn underline">Browse all movies</Link>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-xl">Trending this week</h2>
        <div className="poster-grid">
          {movies.length === 0
            ? Array.from({ length: 12 }).map((_, n) => <div key={n} className="skeleton aspect-[2/3] rounded-xl" />)
            : movies.map((m) => <MovieCard key={m.id} movie={m} fluid />)}
        </div>
      </section>
    </div>
  );
}
