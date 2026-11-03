import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import ExportCard from "../components/ExportCard";
import DeleteAccountCard from "../components/DeleteAccountCard";

export default function Settings() {
  const { profile, session, refreshProfile, signOut } = useAuth();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  async function newInvite() {
    setMsg("");
    const { data, error } = await supabase.rpc("create_invite");
    if (error) setMsg(error.message);
    else setCode(data as string);
  }

  async function leave() {
    if (!confirm("Leave your couple? You'll stop seeing each other's data. Your own diary and reviews stay yours.")) return;
    const { error } = await supabase.rpc("leave_couple");
    if (error) setMsg(error.message);
    else {
      setCode("");
      await refreshProfile();
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-3xl">Settings</h1>

      <div className="sticker-card p-6">
        <h2 className="text-lg">Account</h2>
        <p className="text-muted-foreground">{session?.user.email}</p>
        <button className="btn-soft mt-3" onClick={signOut}>Log out</button>
      </div>

      <div className="sticker-card p-6">
        <h2 className="text-lg">Your couple</h2>
        {profile?.couple_id ? (
          <>
            <p className="text-muted-foreground">You're paired. Need to invite your partner again?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={newInvite}>New invite code</button>
              <button className="btn-danger" onClick={leave}>Leave couple</button>
            </div>
            {code && <p className="mt-3 rounded-sticker bg-butter p-3 text-center font-heading text-2xl tracking-widest">{code}</p>}
          </>
        ) : (
          <>
            <p className="text-muted-foreground">You're not paired with anyone yet.</p>
            <Link to="/onboarding" className="btn-primary mt-3">Pair up</Link>
          </>
        )}
        {msg && <p role="alert" className="mt-3 font-semibold text-destructive">{msg}</p>}
      </div>

      <ExportCard />
      <DeleteAccountCard />
    </div>
  );
}
