import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { APP_NAME } from "../lib/brand";

export default function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const isSignup = mode === "signup";

  if (!loading && session) return <Navigate to="/app" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name || email.split("@")[0] }, emailRedirectTo: window.location.origin },
      });
      if (error) setError(error.message);
      else if (data.session) navigate("/onboarding");
      else setCheckEmail(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else navigate("/app");
    }
    setBusy(false);
  }

  if (checkEmail)
    return (
      <div className="mx-auto mt-24 max-w-md px-5">
        <div className="sticker-card p-8 text-center">
          <h1 className="text-2xl">Check your email</h1>
          <p className="mt-2 text-muted-foreground">
            We sent a confirmation link to <b>{email}</b>. Open it, then come back and log in.
          </p>
          <Link to="/login" className="btn-primary mt-6">Go to log in</Link>
        </div>
      </div>
    );

  return (
    <div className="mx-auto mt-16 max-w-md px-5">
      <Link to="/" className="mb-4 block text-center font-heading text-xl font-bold">{APP_NAME}</Link>
      <form onSubmit={submit} className="sticker-card space-y-4 p-8">
        <h1 className="text-2xl">{isSignup ? "Create your account" : "Welcome back"}</h1>
        {isSignup && (
          <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <input className="input" type="email" required placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <input className="input" type="password" required minLength={8} placeholder="Password (8+ characters)"
          value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete={isSignup ? "new-password" : "current-password"} />
        {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "One moment…" : isSignup ? "Sign up" : "Log in"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account? " : "New here? "}
          <Link className="font-bold text-berry underline" to={isSignup ? "/login" : "/signup"}>
            {isSignup ? "Log in" : "Sign up"}
          </Link>
        </p>
      </form>
    </div>
  );
}
