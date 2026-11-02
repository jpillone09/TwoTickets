import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

export default function Onboarding() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function startCouple() {
    setBusy(true);
    setError("");
    try {
      if (!profile?.couple_id) {
        const { error } = await supabase.rpc("create_couple", { couple_name: null });
        if (error) throw error;
      }
      const { data, error } = await supabase.rpc("create_invite");
      if (error) throw error;
      setInviteCode(data as string);
      await refreshProfile();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function join() {
    setBusy(true);
    setError("");
    const { error } = await supabase.rpc("join_couple", { invite_code: code });
    if (error) setError(error.message);
    else {
      await refreshProfile();
      navigate("/app");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto mt-12 max-w-2xl space-y-5 px-5">
      <h1 className="text-center text-3xl">Is your partner joining you?</h1>
      {error && <p role="alert" className="text-center font-semibold text-destructive">{error}</p>}

      <div className="sticker-card p-6">
        <h2 className="text-xl">I'll invite my partner</h2>
        {inviteCode ? (
          <div className="mt-3">
            <p className="text-muted-foreground">Send this code to your partner. It works once and expires in 7 days.</p>
            <p className="my-3 rounded-sticker bg-butter p-4 text-center font-heading text-3xl tracking-widest">{inviteCode}</p>
            <Link to="/app" className="btn-primary">Continue to the app</Link>
          </div>
        ) : (
          <button className="btn-primary mt-3" onClick={startCouple} disabled={busy}>Get an invite code</button>
        )}
      </div>

      <div className="sticker-card p-6">
        <h2 className="text-xl">My partner already invited me</h2>
        <div className="mt-3 flex gap-2">
          <input className="input uppercase" placeholder="Enter code" value={code} maxLength={8}
            onChange={(e) => setCode(e.target.value)} />
          <button className="btn-primary" onClick={join} disabled={busy || code.length < 8}>Join</button>
        </div>
      </div>

      <p className="text-center">
        <Link to="/app" className="font-semibold text-muted-foreground underline">Skip for now, I'll do this later</Link>
      </p>
    </div>
  );
}
