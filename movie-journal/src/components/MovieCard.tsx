import { Link } from "react-router-dom";
import { Clapperboard, Star } from "lucide-react";
import { img, yearOf, type MovieSummary } from "../lib/tmdb";

export default function MovieCard({ movie }: { movie: MovieSummary }) {
  const src = img(movie.poster_path);
  return (
    <Link to={`/app/movie/${movie.id}`} className="group block w-36 shrink-0 md:w-40">
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
  );
}
