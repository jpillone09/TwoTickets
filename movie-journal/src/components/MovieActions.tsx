import { useEffect, useState } from "react";
import { Send, Star } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

/** Favorite toggle + "Recommend to partner" for a movie. */
export default function MovieActions({ movie, paired }: { movie: { id: number; title: string }; paired: boolean }) {
  const { session } = useAuth();
  const uid = session!.user.id;
  const [fav, setFav] = useState(false);
  const [partner, setPartner] = useState<{ id: string; display_name: string | null } | null>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSent(false); setOpen(false);
    supabase.from("favorite_movies").select("movie_id").eq("user_id", uid).eq("movie_id", movie.id)
      .then(({ data }) => setFav((data ?? []).length > 0));
    if (paired) supabase.from("profiles").select("id,display_name").neq("id", uid).maybeSingle().then(({ data }) => setPartner(data));
  }, [movie.id, uid, paired]);

  async function toggleFav() {
    setError("");
    const { error } = fav
      ? await supabase.from("favorite_movies").delete().eq("user_id", uid).eq("movie_id", movie.id)
      : await supabase.from("favorite_movies").insert({ user_id: uid, movie_id: movie.id });
    if (error) setError(error.message); else setFav(!fav);
  }

  async function send() {
    if (!partner) return;
    setError("");
    const { error } = await supabase.from("recommendations")
      .insert({ sender_id: uid, recipient_id: partner.id, movie_id: movie.id, message: message.trim() || null });
    if (error) return setError(error.message);
    setSent(true); setOpen(false); setMessage("");
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <button className={fav ? "btn-primary" : "btn-soft"} onClick={toggleFav} aria-pressed={fav}>
          <Star size={18} className={fav ? "fill-current" : ""} /> {fav ? "Favorite" : "Add to favorites"}
        </button>
        {paired && partner && !sent && (
          <button className="btn-soft" onClick={() => setOpen((o) => !o)}><Send size={18} /> Recommend to {partner.display_name ?? "partner"}</button>
        )}
        {sent && <span className="chip self-center !bg-butter">Recommendation sent!</span>}
      </div>
      {open && (
        <div className="flex gap-2">
          <input className="input" placeholder="Add a message (optional)" maxLength={200} value={message} onChange={(e) => setMessage(e.target.value)} />
          <button className="btn-primary" onClick={send}>Send</button>
        </div>
      )}
      {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}
