import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Compass, Heart, KeyRound, ListVideo, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import Avatar from "../components/Avatar";
import { img } from "../lib/tmdb";
import { timeAgo } from "../lib/types";

type Mv = { id: number; title: string; poster_path: string | null };
type Activity = { key: string; uid: string; who: string; what: string; movie: Mv; at: string; kind: string };

export default function Home() {
  const { profile, partner, session } = useAuth();
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
      ].filter((a) => a.movie).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);
      setFeed(items);
      setPending(p.count ?? 0);
      setLoading(false);
    })();
  }, [uid]);

  const recent = feed.filter((f) => f.kind === "watched").slice(0, 10);
  const first = profile?.display_name ?? "there";
  const actions = [
    { to: "/app/discover", label: "Log a movie", icon: BookOpen },
    { to: "/app/discover", label: "Find something", icon: Compass },
    { to: "/app/watchlist", label: "My watchlist", icon: ListVideo },
    { to: "/app/shared", label: "Our watchlist", icon: Heart },
  ];

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <div className="ticket flex items-center gap-4 px-8 py-6">
          <Avatar url={profile?.avatar_url ?? null} name={first} size={64} />
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-berry">Admit one {partner ? "+ one" : ""}</p>
            <h1 className="text-3xl">Hi, {first}!</h1>
            <p className="text-muted-foreground">What are we watching today?</p>
          </div>
          <Link to="/app/discover" className="btn-primary hidden sm:inline-flex">Find a movie</Link>
        </div>

        {pending > 0 && (
          <Link to="/app/for-you" className="sticker-card flex items-center gap-3 !bg-butter p-4 font-semibold">
            <Sparkles className="text-berry" /> You have {pending} new recommendation{pending > 1 ? "s" : ""} waiting
          </Link>
        )}

        {recent.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl">Recently watched</h2>
            <div className="poster-grid">
              {recent.map((a) => a.movie.poster_path && (
                <Link key={a.key} to={`/app/movie/${a.movie.id}`} title={`${a.who}: ${a.movie.title}`}>
                  <img src={img(a.movie.poster_path, "w342")!} alt={a.movie.title}
                    className={`aspect-[2/3] w-full rounded-xl border-4 object-cover shadow-md transition hover:-translate-y-1 ${a.uid === uid ? "border-primary" : "border-accent"}`} />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-xl">Activity</h2>
          {loading && <div className="space-y-2">{[0, 1, 2].map((n) => <div key={n} className="skeleton h-16 rounded-sticker" />)}</div>}
          {!loading && feed.length === 0 && (
            <div className="sticker-card p-6 text-center text-muted-foreground">
              Nothing yet. <Link to="/app/discover" className="font-bold text-berry underline">Find a movie</Link> and log your first one.
            </div>
          )}
          <div className="space-y-2">
            {feed.map((a) => (
              <Link key={a.key} to={`/app/movie/${a.movie.id}`} className="sticker-card flex items-center gap-3 p-3 transition hover:-translate-y-0.5">
                {a.movie.poster_path && <img src={img(a.movie.poster_path, "w185")!} alt="" className="w-10 rounded-md border-2 border-white" />}
                <span className="flex-1"><b className={a.uid === uid ? "text-berry" : ""}>{a.who}</b> {a.what} <b>{a.movie.title}</b></span>
                <span className="text-xs text-muted-foreground">{timeAgo(a.at)}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="sticker-card p-5">
          {!profile?.couple_id ? (
            <>
              <Heart className="mb-2 text-berry" />
              <h2 className="text-lg">Invite your partner</h2>
              <p className="text-sm text-muted-foreground">Pair up to unlock your shared watchlist, partner reviews and recommendations.</p>
              <Link to="/onboarding" className="btn-primary mt-3 w-full">Pair up</Link>
            </>
          ) : !partner ? (
            <>
              <KeyRound className="mb-2 text-berry" />
              <h2 className="text-lg">Waiting for your partner</h2>
              <p className="text-sm text-muted-foreground">You've started a couple. Share an invite code so they can join you.</p>
              <Link to="/onboarding" className="btn-primary mt-3 w-full">Get an invite code</Link>
            </>
          ) : (
            <>
              <div className="flex items-center">
                <Avatar url={profile.avatar_url} name={first} size={52} />
                <span className="-ml-3"><Avatar url={partner.avatar_url} name={partner.display_name ?? partner.username} size={52} /></span>
              </div>
              <h2 className="mt-3 text-lg">You &amp; {partner.display_name ?? partner.username}</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <Link to="/app/shared" className="chip">Our watchlist</Link>
                <Link to="/app/stats/couple" className="chip">Our stats</Link>
                <Link to={`/app/u/${partner.username}`} className="chip">Their profile</Link>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {actions.map(({ to, label, icon: Icon }) => (
            <Link key={label} to={to} className="sticker-card flex flex-col items-center gap-2 p-4 text-center font-heading text-sm font-bold transition hover:-translate-y-0.5">
              <Icon className="text-berry" /> {label}
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
