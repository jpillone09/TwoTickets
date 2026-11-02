import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type Profile = {
  id: string;
  couple_id: string | null;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type AuthContext = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthContext>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid?: string) => {
    if (!uid) return setProfile(null);
    const { data } = await supabase
      .from("profiles")
      .select("id, couple_id, username, display_name, avatar_url")
      .eq("id", uid)
      .single();
    setProfile(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // defer: calling supabase inside this callback can deadlock
      setTimeout(() => loadProfile(s?.user.id), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value: AuthContext = {
    session,
    profile,
    loading,
    refreshProfile: () => loadProfile(session?.user.id),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
