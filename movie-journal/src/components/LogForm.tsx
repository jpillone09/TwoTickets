import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { StarInput } from "./StarRating";
import type { ReviewRow } from "../lib/types";

type Props = {
  movie: { id: number; title: string };
  existing: ReviewRow | null;
  priorViews: number;
  paired: boolean;
  onSaved: () => void;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function LogForm({ movie, existing, priorViews, paired, onSaved }: Props) {
  const { session } = useAuth();
  const [date, setDate] = useState(today());
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null);
  const [body, setBody] = useState(existing?.body ?? "");
  const [spoilers, setSpoilers] = useState(existing?.contains_spoilers ?? false);
  const [tags, setTags] = useState((existing?.tags ?? []).join(", "));
  const [rewatch, setRewatch] = useState(priorViews > 0);
  const [together, setTogether] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent | null, logViewing: boolean) {
    e?.preventDefault();
    setError("");
    setBusy(true);
    try {
      const uid = session!.user.id;
      let reviewId: string | null = null;
      if (rating !== null || body.trim()) {
        const tagList = tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 8);
        const { data, error } = await supabase
          .from("reviews")
          .upsert(
            { user_id: uid, movie_id: movie.id, rating, body: body.trim() || null,
              contains_spoilers: spoilers, tags: tagList, updated_at: new Date().toISOString() },
            { onConflict: "user_id,movie_id" },
          )
          .select("id")
          .single();
        if (error) throw error;
        reviewId = data.id;
      } else if (existing) {
        // cleared both rating and text: remove the review
        const { error } = await supabase.from("reviews").delete().eq("id", existing.id);
        if (error) throw error;
      }
      if (logViewing) {
        const { error } = await supabase.from("diary_entries").insert({
          user_id: uid, movie_id: movie.id, watched_on: date, rating, review_id: reviewId,
          is_rewatch: rewatch, watched_together: paired && together, notes: notes.trim() || null,
        });
        if (error) throw error;
      }
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={(e) => save(e, true)} className="sticker-card mt-5 space-y-4 p-5">
      <h2 className="text-lg">Log "{movie.title}"</h2>
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm font-semibold">Date watched
          <input type="date" className="input mt-1" value={date} max={today()} required onChange={(e) => setDate(e.target.value)} />
        </label>
        <div>
          <p className="text-sm font-semibold">Rating</p>
          <StarInput value={rating} onChange={setRating} />
        </div>
      </div>

      <textarea className="input rounded-sticker" rows={4} placeholder="Write a review (optional)…" value={body}
        onChange={(e) => setBody(e.target.value)} />
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
        <label className="flex items-center gap-2"><input type="checkbox" checked={spoilers} onChange={(e) => setSpoilers(e.target.checked)} /> Contains spoilers</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={rewatch} onChange={(e) => setRewatch(e.target.checked)} /> Rewatch</label>
        {paired && (
          <label className="flex items-center gap-2"><input type="checkbox" checked={together} onChange={(e) => setTogether(e.target.checked)} /> Watched together</label>
        )}
      </div>
      <input className="input" placeholder="Tags, separated by commas (cozy, cried, date night)" value={tags} onChange={(e) => setTags(e.target.value)} />
      <input className="input" placeholder="Private notes about this viewing (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

      {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Log viewing"}</button>
        <button type="button" className="btn-soft" disabled={busy} onClick={() => save(null, false)}>
          Save rating/review only
        </button>
      </div>
    </form>
  );
}
