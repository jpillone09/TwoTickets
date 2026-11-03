import { Link } from "react-router-dom";
import { Check, Clapperboard, Plus, Star } from "lucide-react";
import { img, yearOf, type MovieSummary } from "../lib/tmdb";
import { useMyWatchlist } from "../lib/WatchlistContext";

export default function MovieCard({ movie, fluid = false }: { movie: MovieSummary; fluid?: boolean }) {
  const src = img(movie.poster_path);
  const wl = useMyWatchlist();
  const on = wl.has(movie.id);
  return (
    <div className={`group relative ${fluid ? "w-full" : "w-36 shrink-0 md:w-40"}`}>
      <Link to={`/app/movie/${movie.id}`} className="block">
        <div className="aspect-[2/3] overflow-hidden rounded-xl border-4 border-white bg-secondary shadow-md transition group-hover:-translate-y-1">
          {src ? (
            <img src={src} alt={`${movie.title} poster`} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center"><Clapperboard className="text-primary" /></div>
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-sm font-bold leading-tight">{movie.title}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {yearOf(movie.release_date)}
          {movie.vote_average > 0 && (
            <span className="ml-auto flex items-center gap-0.5"><Star size={12} className="fill-primary text-primary" />{movie.vote_average.toFixed(1)}</span>
          )}
        </p>
      </Link>
      {wl.ready && (
        <button type="button" onClick={() => wl.toggle(movie.id)} disabled={wl.busy === movie.id} aria-pressed={on}
          aria-label={on ? `Remove ${movie.title} from my watchlist` : `Add ${movie.title} to my watchlist`}
          className={`absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white shadow-md transition disabled:opacity-60 ${
            on ? "bg-primary text-primary-foreground" : "bg-white/90 text-berry md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"}`}>
          {on ? <Check size={18} /> : <Plus size={18} />}
        </button>
      )}
    </div>
  );
}
