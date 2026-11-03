import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Compass, Heart, ListVideo, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { img } from "../lib/tmdb";
import { timeAgo } from "../lib/types";

type Mv = { id: number; title: string; poster_path: string | null };
type Activity = { key: string; uid: string; who: string; what: string; movie: Mv; at: string; kind: string };

export default function Home() {
  const { profile, session } = useAuth();
  const uid = session!.user.id;
  const [feed, setFeed] = useState<Activity[]>([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [d, r, w, p] = await Promise.all([
        supabase.from("diary_entries").select("id,user_id,created_at,watched_together,movie:movies(id,title,poster_path),user:profiles(display_name)").order("created_at", { ascending: false }).limit(10),
        supabase.from("reviews").select("id,user_id,created_at,rating,body,movie:movies(id,title,poster_path),user:profiles(display_name)").order("created_at", { ascending: false }).limit(10),
        supabase.from("watchlist_movies").select("id,added_by,added_at,watchlist:watchlists(kind),movie:movies(id,title,poster_path),user:profiles(display_name)").order("added_at", { ascending: false }).limit(10),
        supabase.from("recommendations").select("id", { count: "exact", head: true }).eq("recipient_id", uid).eq("status", "pending"),
      ]);
      type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
      const name = (x: Any) => (x.user_id ?? x.added_by) === uid ? "You" : x.user?.display_name ?? "Your partner";
      const items: Activity[] = [
        ...((d.data ?? []) as Any[]).map((x) => ({ key: "d" + x.id, uid: x.user_id, who: name(x), kind: "watched", at: x.created_at, movie: x.movie,
          what: x.watched_together ? "watched together" : "logged" })),
        ...((r.data ?? []) as Any[]).map((x) => ({ key: "r" + x.id, uid: x.user_id, who: name(x), kind: "review", at: x.created_at, movie: x.movie,
          what: x.body ? "reviewed" : `rated ${x.rating ?? ""}★` })),
        ...((w.data ?? []) as Any[]).map((x) => ({ key: "w" + x.id, uid: x.added_by, who: name(x), kind: "watchlist", at: x.added_at, movie: x.movie,
          what: x.watchlist?.kind === "shared" ? "added to our watchlist:" : "added to a watchlist:" })),
      ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);
      setFeed(items);
      setPending(p.count ?? 0);
      setLoading(false);
    })();
  }, [uid]);

  const recent = feed.filter((f) => f.kind === "watched").slice(0, 8);
  const actions = [
    { to: "/app/discover", label: "Log a movie", icon: BookOpen },
    { to: "/app/discover", label: "Write a review", icon: Compass },
    { to: "/app/watchlist", label: "My watchlist", icon: ListVideo },
    { to: "/app/shared", label: "Our watchlist", icon: Heart },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl">Hi, {profile?.display_name ?? "there"}!</h1>

      {!profile?.couple_id && (
        <div className="sticker-card flex items-center gap-4 p-5">
          <Heart className="shrink-0 text-berry" />
          <div className="flex-1"><h2 className="text-lg">Invite your partner</h2>
            <p className="text-muted-foreground">Pair up to unlock your shared watchlist, partner reviews and recommendations.</p></div>
          <Link to="/onboarding" className="btn-primary">Pair up</Link>
        </div>
      )}
      {pending > 0 && (
        <Link to="/app/for-you" className="sticker-card flex items-center gap-3 !bg-butter p-4 font-semibold">
          <Sparkles className="text-berry" /> You have {pending} new recommendation{pending > 1 ? "s" : ""} waiting
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {actions.map(({ to, label, icon: Icon }) => (
          <Link key={label} to={to} className="sticker-card flex flex-col items-center gap-2 p-4 text-center font-heading font-bold hover:-translate-y-0.5">
            <Icon className="text-berry" /> {label}
          </Link>
        ))}
      </div>

      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl">Recently watched</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recent.map((a) => a.movie.poster_path && (
              <Link key={a.key} to={`/app/movie/${a.movie.id}`} title={`${a.who}: ${a.movie.title}`} className="w-24 shrink-0">
                <img src={img(a.movie.poster_path, "w185")!} alt={a.movie.title}
                  className={`rounded-xl border-4 object-cover shadow-md ${a.uid === uid ? "border-primary" : "border-accent"}`} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl">Activity</h2>
        {loading && <p className="text-muted-foreground">Loading…</p>}
        {!loading && feed.length === 0 && <p className="text-muted-foreground">Nothing yet. Find a movie in Discover and log your first one.</p>}
        <div className="space-y-2">
          {feed.map((a) => (
            <Link key={a.key} to={`/app/movie/${a.movie.id}`} className="sticker-card flex items-center gap-3 p-3">
              {a.movie.poster_path && <img src={img(a.movie.poster_path, "w185")!} alt="" className="w-10 rounded-md border-2 border-white" />}
              <span className="flex-1"><b className={a.uid === uid ? "text-berry" : ""}>{a.who}</b> {a.what} <b>{a.movie.title}</b></span>
              <span className="text-xs text-muted-foreground">{timeAgo(a.at)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
