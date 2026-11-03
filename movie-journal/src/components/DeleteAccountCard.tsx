import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

export default function DeleteAccountCard() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const uid = session!.user.id;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function destroy() {
    setError(""); setBusy(true);
    try {
      // remove uploaded avatars first (the files live in storage, not the database)
      const { data: files } = await supabase.storage.from("avatars").list(uid);
      if (files?.length) await supabase.storage.from("avatars").remove(files.map((f) => `${uid}/${f.name}`));
      const { error } = await supabase.rpc("delete_my_account");
      if (error) throw error;
      await signOut();
      navigate("/", { replace: true });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="sticker-card border-destructive/40 p-6">
      <h2 className="text-lg text-destructive">Delete account</h2>
      <p className="text-muted-foreground">
        Permanently deletes your account and everything you've logged: diary, reviews, lists and watchlist entries.
        Movies you added to a shared watchlist are removed too. This can't be undone, so download your data first.
      </p>
      {!open ? (
        <button className="btn-danger mt-3" onClick={() => setOpen(true)}><Trash2 size={16} /> Delete my account</button>
      ) : (
        <div className="mt-3 space-y-2">
          <label className="text-sm font-semibold">Type DELETE to confirm
            <input className="input mt-1" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" /></label>
          <div className="flex gap-2">
            <button className="btn-danger" disabled={text !== "DELETE" || busy} onClick={destroy}>{busy ? "Deleting…" : "Delete forever"}</button>
            <button className="btn-soft" disabled={busy} onClick={() => { setOpen(false); setText(""); }}>Cancel</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}
