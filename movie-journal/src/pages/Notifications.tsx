import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { img } from "../lib/tmdb";
import { timeAgo } from "../lib/types";

type N = {
  id: string; type: string; movie_id: number | null; ref_id: string | null; read_at: string | null; created_at: string;
  actor: { display_name: string | null } | null; movie: { title: string; poster_path: string | null } | null;
};

const TEXT: Record<string, (t: string) => string> = {
  movie_logged: (t) => `logged ${t || "a movie"}`,
  review_published: (t) => `published a review of ${t || "a movie"}`,
  movie_added: (t) => `added ${t || "a movie"} to a watchlist`,
  recommendation: (t) => `recommended ${t || "a movie"} to you`,
  comment: () => "commented on a review",
  reaction: () => "reacted to a review",
};

export default function Notifications() {
  const { session } = useAuth();
  const uid = session!.user.id;
  const navigate = useNavigate();
  const [items, setItems] = useState<N[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from("notifications")
      .select("id,type,movie_id,ref_id,read_at,created_at,actor:profiles!notifications_actor_id_fkey(display_name),movie:movies(title,poster_path)")
      .eq("user_id", uid).order("created_at", { ascending: false }).limit(60);
    setItems((data ?? []) as unknown as N[]);
    setLoading(false);
  }, [uid]);
  useEffect(() => { load(); }, [load]);

  const changed = () => window.dispatchEvent(new Event("notifications-changed"));

  async function open(n: N) {
    if (!n.read_at) {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
      changed();
    }
    navigate(n.type === "recommendation" ? "/app/for-you" : n.movie_id ? `/app/movie/${n.movie_id}` : "/app/reviews");
  }

  async function markAll() {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", uid).is("read_at", null);
    changed(); load();
  }

  const unread = items.filter((i) => !i.read_at).length;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Notifications</h1>
        {unread > 0 && <button className="btn-soft" onClick={markAll}>Mark all as read</button>}
      </div>
      {loading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      {!loading && items.length === 0 && (
        <div className="sticker-card mt-6 p-8 text-center"><Bell className="mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Nothing yet. When your partner logs, reviews or recommends something, you'll see it here.</p></div>
      )}
      <div className="mt-5 space-y-2">
        {items.map((n) => (
          <button key={n.id} onClick={() => open(n)}
            className={`sticker-card flex w-full items-center gap-3 p-3 text-left ${n.read_at ? "opacity-70" : "!bg-secondary"}`}>
            {n.movie?.poster_path
              ? <img src={img(n.movie.poster_path, "w185")!} alt="" className="w-10 rounded-md border-2 border-white" />
              : <Bell className="m-2 text-primary" />}
            <span className="flex-1"><b>{n.actor?.display_name ?? "Your partner"}</b> {(TEXT[n.type] ?? (() => "did something"))(n.movie?.title ?? "")}
              <span className="block text-xs text-muted-foreground">{timeAgo(n.created_at)}</span></span>
            {!n.read_at && <span className="h-3 w-3 rounded-full bg-berry" aria-label="Unread" />}
          </button>
        ))}
      </div>
    </div>
  );
}
