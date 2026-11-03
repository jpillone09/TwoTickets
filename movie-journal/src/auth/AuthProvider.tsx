import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type Profile = {
  id: string; couple_id: string | null; username: string; display_name: string | null; avatar_url: string | null;
};
export type Partner = { id: string; username: string; display_name: string | null; avatar_url: string | null };

type AuthContext = {
  session: Session | null;
  profile: Profile | null;
  /** Your partner, once they have joined your couple. Null if you're solo or still waiting for them. */
  partner: Partner | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthContext>(null!);
export const useAuth = () => useContext(Ctx);

const keep = <T,>(prev: T | null, next: T | null) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid?: string) => {
    if (!uid) { setProfile(null); setPartner(null); return; }
    const { data } = await supabase.from("profiles").select("id, couple_id, username, display_name, avatar_url").eq("id", uid).single();
    setProfile((prev) => keep(prev, data as Profile | null));
    if (data?.couple_id) {
      // privacy rules only ever let you see yourself and your partner, so "not me" is your partner
      const { data: p } = await supabase.from("profiles").select("id, username, display_name, avatar_url").neq("id", uid).maybeSingle();
      setPartner((prev) => keep(prev, p as Partner | null));
    } else setPartner(null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setTimeout(() => loadProfile(s?.user.id), 0); // deferred: calling supabase inside this callback can deadlock
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value: AuthContext = {
    session, profile, partner, loading,
    refreshProfile: () => loadProfile(session?.user.id),
    signOut: async () => { await supabase.auth.signOut(); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
