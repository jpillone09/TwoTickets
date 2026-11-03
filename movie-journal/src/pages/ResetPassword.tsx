import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

export default function ResetPassword() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setError(error.message); else navigate("/app");
  }

  return (
    <div className="mx-auto mt-24 max-w-md px-5">
      <div className="sticker-card space-y-4 p-8">
        <h1 className="text-2xl">Choose a new password</h1>
        {loading ? <p className="text-muted-foreground">Loading…</p> : !session ? (
          <>
            <p className="text-muted-foreground">This page works from the link in your reset email. If the link expired, ask for a new one.</p>
            <Link to="/login" className="btn-primary">Back to log in</Link>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input className="input" type="password" required minLength={8} placeholder="New password (8+ characters)" value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Save new password"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
