import { Link } from "react-router-dom";
import { Clapperboard, Heart, ListVideo, Star } from "lucide-react";
import { APP_NAME, TAGLINE } from "../lib/brand";

const features = [
  { icon: ListVideo, title: "A watchlist for two", text: "Add movies you both want to see and pick one at random on movie night." },
  { icon: Star, title: "Rate and review", text: "Half-star ratings, spoiler-safe reviews, and a diary of every rewatch." },
  { icon: Heart, title: "Private to you both", text: "Only you and your partner can see what you log. Nobody else." },
];

export default function Landing() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-heading text-xl font-bold">
          <Clapperboard className="text-berry" /> {APP_NAME}
        </div>
        <Link to="/login" className="btn-soft">Log in</Link>
      </header>

      <section className="py-16 text-center md:py-24">
        <h1 className="text-4xl leading-tight md:text-6xl">{TAGLINE}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Log what you watch, rate it together, and keep a shared list of movies for date night.
        </p>
        <Link to="/signup" className="btn-primary mt-8 text-lg">Start your movie diary</Link>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="sticker-card p-6">
            <Icon className="mb-3 text-berry" />
            <h2 className="text-lg">{title}</h2>
            <p className="mt-1 text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <footer className="mt-16 text-center text-sm text-muted-foreground">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </div>
  );
}
