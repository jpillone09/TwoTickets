import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const Ctx = createContext<(reason: string) => boolean>(() => true);

/**
 * Call it before doing something that needs an account.
 * Signed in: returns true. Visitor: opens the sign-up prompt and returns false.
 *   if (!requireAuth("add movies to your watchlist")) return;
 */
export const useRequireAuth = () => useContext(Ctx);

export function AuthPromptProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();
  const [reason, setReason] = useState<string | null>(null);

  const requireAuth = useCallback((r: string) => {
    if (session) return true;
    setReason(r);
    return false;
  }, [session]);

  useEffect(() => setReason(null), [location.pathname]);
  useEffect(() => {
    if (!reason) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setReason(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reason]);

  const next = encodeURIComponent(location.pathname + location.search);

  return (
    <Ctx.Provider value={requireAuth}>
      {children}
      {reason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReason(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="auth-prompt-title" onClick={(e) => e.stopPropagation()}
            className="sticker-card w-full max-w-sm space-y-4 p-7 text-center">
            <h2 id="auth-prompt-title" className="text-2xl">Join to {reason}</h2>
            <p className="text-muted-foreground">TwoTickets is free. Create an account to save your movies, ratings and watchlists, and share them with your partner.</p>
            <div className="flex flex-col gap-2">
              <Link to={`/signup?next=${next}`} className="btn-primary" autoFocus>Sign up free</Link>
              <Link to={`/login?next=${next}`} className="btn-soft">I already have an account</Link>
              <button type="button" className="text-sm font-semibold text-muted-foreground underline" onClick={() => setReason(null)}>Not now</button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
