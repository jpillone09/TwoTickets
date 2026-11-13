import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { EyeOff, Heart, MessageCircle, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { Stars } from "./StarRating";
import { img } from "../lib/tmdb";
import { fmtDate, type ReviewRow } from "../lib/types";

type Comment = {
  id: string; user_id: string; parent_id: string | null; body: string; created_at: string;
  author: { display_name: string | null } | null;
};

export default function ReviewCard({ review, showMovie = false, onChanged }: {
  review: ReviewRow; showMovie?: boolean; onChanged?: () => void;
}) {
  const { session } = useAuth();
  const uid = session!.user.id;
  const own = review.user_id === uid;
  const [revealed, setRevealed] = useState(false);
  const [likes, setLikes] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadLikes = useCallback(async () => {
    const { data } = await supabase.from("review_likes").select("user_id").eq("review_id", review.id).eq("emoji", "♥");
    setLikes((data ?? []).map((l) => l.user_id as string));
  }, [review.id]);

  const loadComments = useCallback(async () => {
    const { data } = await supabase.from("review_comments")
      .select("id,user_id,parent_id,body,created_at,author:profiles!user_id(display_name)")
      .eq("review_id", review.id).order("created_at");
    setComments((data ?? []) as unknown as Comment[]);
  }, [review.id]);

  useEffect(() => { loadLikes(); loadComments(); }, [loadLikes, loadComments]);

  async function toggleLike() {
    setError("");
    const liked = likes.includes(uid);
    const { error } = liked
      ? await supabase.from("review_likes").delete().eq("review_id", review.id).eq("user_id", uid).eq("emoji", "♥")
      : await supabase.from("review_likes").insert({ review_id: review.id, user_id: uid });
    if (error) setError(error.message);
    loadLikes();
  }

  async function addComment(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const { error } = await supabase.from("review_comments")
      .insert({ review_id: review.id, user_id: uid, body: text.trim(), parent_id: replyTo });
    if (error) return setError(error.message);
    setText(""); setReplyTo(null); loadComments();
  }

  async function removeComment(id: string) {
    await supabase.from("review_comments").delete().eq("id", id);
    loadComments();
  }

  async function removeReview() {
    if (!confirm("Delete this rating and review? Your diary entries stay.")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", review.id);
    if (error) setError(error.message); else onChanged?.();
  }

  const poster = img(review.movie?.poster_path ?? null, "w185");
  const hidden = review.contains_spoilers && !revealed && !own;
  const top = comments.filter((c) => !c.parent_id);
  const CommentView = ({ c, reply = false }: { c: Comment; reply?: boolean }) => (
    <div className={`rounded-xl bg-secondary/60 p-3 text-sm ${reply ? "ml-6" : ""}`}>
      <b>{c.author?.display_name ?? "Someone"}</b> <span className="text-xs text-muted-foreground">{fmtDate(c.created_at)}</span>
      <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
      <div className="mt-1 flex gap-3 text-xs font-semibold text-berry">
        {!reply && <button onClick={() => setReplyTo(c.id)}>Reply</button>}
        {c.user_id === uid && <button onClick={() => removeComment(c.id)}>Delete</button>}
      </div>
    </div>
  );

  return (
    <article className="sticker-card flex gap-4 p-4">
      {showMovie && (
        <Link to={`/app/movie/${review.movie_id}`} className="w-20 shrink-0">
          {poster && <img src={poster} alt="" className="rounded-lg border-2 border-card shadow" />}
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {showMovie && <Link to={`/app/movie/${review.movie_id}`} className="font-heading text-lg font-bold">{review.movie?.title}</Link>}
          <Stars value={review.rating} />
          <span className="text-sm text-muted-foreground">
            {own ? "You" : review.author?.username
              ? <Link to={`/app/u/${review.author.username}`} className="font-semibold text-berry">{review.author.display_name ?? "Partner"}</Link>
              : "Partner"} · {fmtDate(review.created_at)}
          </span>
        </div>

        {review.body && (hidden ? (
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-butter p-3 text-sm font-semibold">
            <EyeOff size={18} /> This review contains spoilers.
            <button className="btn-soft !px-3 !py-1" onClick={() => setRevealed(true)}>Show</button>
          </div>
        ) : <p className="mt-2 whitespace-pre-wrap">{review.body}</p>)}

        {review.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">{review.tags.map((t) => <span key={t} className="chip">#{t}</span>)}</div>
        )}

        <div className="mt-3 flex items-center gap-4 text-sm font-semibold">
          <button onClick={toggleLike} disabled={own} title={own ? "You can't like your own review" : "Like"}
            className={`flex items-center gap-1 ${own ? "opacity-50" : ""}`}>
            <Heart size={18} className={likes.includes(uid) ? "fill-berry text-berry" : ""} /> {likes.length}
          </button>
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1">
            <MessageCircle size={18} /> {comments.length}
          </button>
          {own && <button onClick={removeReview} className="ml-auto flex items-center gap-1 text-destructive"><Trash2 size={16} /> Delete</button>}
        </div>
        {error && <p role="alert" className="mt-2 text-sm font-semibold text-destructive">{error}</p>}

        {open && (
          <div className="mt-3 space-y-2">
            {top.map((c) => (
              <div key={c.id} className="space-y-2">
                <CommentView c={c} />
                {comments.filter((r) => r.parent_id === c.id).map((r) => <CommentView key={r.id} c={r} reply />)}
              </div>
            ))}
            <form onSubmit={addComment} className="flex gap-2">
              <input className="input" placeholder={replyTo ? "Write a reply…" : "Add a comment…"} value={text} onChange={(e) => setText(e.target.value)} />
              <button className="btn-primary">Send</button>
              {replyTo && <button type="button" className="btn-soft" onClick={() => setReplyTo(null)}>Cancel</button>}
            </form>
          </div>
        )}
      </div>
    </article>
  );
}
