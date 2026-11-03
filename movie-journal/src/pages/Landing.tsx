import { Link } from "react-router-dom";
import { Heart, ListVideo, Star, Ticket } from "lucide-react";
import { Stars } from "../components/StarRating";
import { APP_NAME, TAGLINE } from "../lib/brand";

const features = [
  { icon: ListVideo, title: "A watchlist for two", text: "Add movies you both want to see and let the app pick one on movie night." },
  { icon: Star, title: "Rate and review", text: "Half-star ratings, spoiler-safe reviews, and a diary of every rewatch." },
  { icon: Heart, title: "Private to you both", text: "Only you and your partner can see what you log. Nobody else." },
];
const steps = ["Sign up in a minute", "Share your invite code", "Log, rate and plan together"];

export default function Landing() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-heading text-xl font-bold"><Ticket className="-rotate-12 text-berry" /> {APP_NAME}</div>
        <div className="flex gap-2"><Link to="/login" className="btn-soft">Log in</Link><Link to="/signup" className="btn-primary hidden sm:inline-flex">Sign up</Link></div>
      </header>

      <section className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
        <div>
          <span className="chip">🎟️ Made for two</span>
          <h1 className="mt-4 text-4xl leading-tight md:text-6xl">{TAGLINE}</h1>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">Log what you watch, rate it together, and keep a shared list of movies for date night.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup" className="btn-primary text-lg">Start your movie diary</Link>
            <Link to="/login" className="btn-soft text-lg">I have an account</Link>
          </div>
        </div>

        <div className="relative mx-auto h-80 w-full max-w-md" aria-hidden>
          <div className="ticket absolute left-0 top-2 w-72 -rotate-6 px-7 py-5">
            <p className="text-xs font-bold uppercase tracking-widest text-berry">Admit one</p>
            <p className="font-heading text-xl font-bold">Movie night</p>
            <div className="my-3 border-t-2 border-dashed border-border" />
            <div className="flex items-center justify-between text-sm"><span>Seat A1 · You</span><Stars value={4.5} size={14} /></div>
          </div>
          <div className="ticket absolute bottom-2 right-0 w-72 rotate-3 !bg-secondary px-7 py-5">
            <p className="text-xs font-bold uppercase tracking-widest text-berry">Admit one</p>
            <p className="font-heading text-xl font-bold">Same movie, different taste</p>
            <div className="my-3 border-t-2 border-dashed border-border" />
            <div className="flex items-center justify-between text-sm"><span>Seat A2 · Partner</span><Stars value={3.5} size={14} /></div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="sticker-card p-6 transition hover:-translate-y-1">
            <Icon className="mb-3 text-berry" /><h2 className="text-lg">{title}</h2><p className="mt-1 text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <section className="py-14">
        <h2 className="mb-6 text-center text-2xl">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s} className="sticker-card flex items-center gap-4 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-heading font-bold text-primary-foreground">{i + 1}</span>
              <span className="font-semibold">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        <p className="mt-2 space-x-4"><Link to="/privacy" className="underline">Privacy</Link><Link to="/terms" className="underline">Terms</Link></p>
      </footer>
    </div>
  );
}
