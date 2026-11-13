import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3, Bell, BookOpen, Compass, Heart, Home, ListPlus, ListVideo, Lock, LogIn, Menu, MessageSquareHeart,
  Moon, Settings, Sparkles, Sun, Ticket, UserRound, Users, type LucideIcon,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { useTheme } from "../lib/theme";
import Avatar from "./Avatar";
import { APP_NAME } from "../lib/brand";
import { WatchlistProvider } from "../lib/WatchlistContext";

type Item = { to: string; label: string; icon: LucideIcon; open?: boolean };
// "open" pages can be used without an account; the rest show a log-in prompt to visitors
const nav: Item[] = [
  { to: "/app", label: "Home", icon: Home, open: true },
  { to: "/app/discover", label: "Discover", icon: Compass, open: true },
  { to: "/app/watchlist", label: "My watchlist", icon: ListVideo },
  { to: "/app/shared", label: "Our watchlist", icon: Heart },
  { to: "/app/diary", label: "Diary", icon: BookOpen },
  { to: "/app/reviews", label: "Reviews", icon: MessageSquareHeart },
  { to: "/app/for-you", label: "For you", icon: Sparkles },
  { to: "/app/lists", label: "My lists", icon: ListPlus },
  { to: "/app/stats", label: "Your stats", icon: BarChart3 },
  { to: "/app/stats/couple", label: "Our stats", icon: Users },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
];
// A link must match exactly when another link lives underneath it (e.g. /app/stats vs /app/stats/couple),
// otherwise both would light up.
const isExact = (to: string) => nav.some((o) => o.to !== to && o.to.startsWith(to + "/"));

export default function AppLayout() {
  const { profile, session, loading, refreshProfile } = useAuth();
  const { resolved, toggle } = useTheme();
  const location = useLocation();
  const uid = session?.user.id;
  const [unread, setUnread] = useState(0);
  const [more, setMore] = useState(false);

  const refresh = useCallback(async () => {
    if (!uid) return setUnread(0);
    const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", uid).is("read_at", null);
    setUnread(count ?? 0);
  }, [uid]);

  useEffect(() => {
    refresh();
    if (!uid) return;
    const t = setInterval(refresh, 30000);
    window.addEventListener("notifications-changed", refresh);
    return () => { clearInterval(t); window.removeEventListener("notifications-changed", refresh); };
  }, [refresh, uid, location.pathname]);

  // pick up your partner joining without a page reload
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (uid) refreshProfile(); }, [location.pathname]);
  useEffect(() => setMore(false), [location.pathname]);

  if (loading) return <div className="min-h-screen" />;

  const guest = !session;
  const next = encodeURIComponent(location.pathname + location.search);
  const badge = (to: string) =>
    to === "/app/notifications" && unread > 0
      ? <span className="ml-auto rounded-full bg-berry px-2 text-xs font-bold text-onberry">{unread}</span> : null;
  const lock = (it: Item) => (guest && !it.open ? <Lock size={14} className="ml-auto opacity-60" aria-label="Log in required" /> : null);
  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-full px-4 py-2.5 font-semibold transition ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-card/70"}`;
  const tab = (isActive: boolean) =>
    `flex flex-col items-center rounded-full px-3 py-1 text-xs font-semibold ${isActive ? "bg-primary text-primary-foreground" : ""}`;
  const profilePath = `/app/u/${profile?.username ?? ""}`;
  const shown = profile?.display_name ?? profile?.username ?? "You";
  const themeLabel = resolved === "dark" ? "Light mode" : "Dark mode";
  const ThemeIcon = resolved === "dark" ? Sun : Moon;

  const moreItems: Item[] = guest
    ? nav.filter((n) => !n.open)
    : [{ to: profilePath, label: "My profile", icon: UserRound },
       ...nav.filter((n) => !["/app", "/app/discover", "/app/diary", "/app/notifications"].includes(n.to)),
       { to: "/app/settings", label: "Settings", icon: Settings }];

  return (
    <WatchlistProvider>
      <div className="min-h-screen md:flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-1 overflow-y-auto border-r-2 border-border bg-secondary p-4 md:flex">
          <div className="mb-3 flex items-center gap-2 px-2 font-heading text-xl font-bold">
            <Ticket className="-rotate-12 text-berry" /> {APP_NAME}
          </div>

          {guest ? (
            <div className="mb-2 rounded-sticker border-2 border-border bg-card/70 p-3">
              <p className="font-heading font-bold">Welcome!</p>
              <p className="text-xs text-muted-foreground">Browse freely. Sign up to save movies.</p>
              <div className="mt-2 flex gap-2">
                <Link to={`/login?next=${next}`} className="btn-soft !px-3 !py-1.5 text-sm">Log in</Link>
                <Link to={`/signup?next=${next}`} className="btn-primary !px-3 !py-1.5 text-sm">Sign up</Link>
              </div>
            </div>
          ) : (
            <NavLink to={profilePath} className={({ isActive }) =>
              `mb-2 flex items-center gap-3 rounded-sticker border-2 bg-card/70 p-2.5 transition hover:bg-card ${isActive ? "border-primary" : "border-border"}`}>
              <Avatar url={profile?.avatar_url ?? null} name={shown} size={44} />
              <span className="min-w-0">
                <span className="block truncate font-heading font-bold">{shown}</span>
                <span className="block text-xs font-semibold text-berry">My profile</span>
              </span>
            </NavLink>
          )}

          {nav.map((it) => (
            <NavLink key={it.to} to={it.to} end={isExact(it.to)} className={link}>
              <it.icon size={20} /> {it.label} {badge(it.to)} {lock(it)}
            </NavLink>
          ))}

          <div className="mt-auto space-y-1 pt-3">
            {!guest && <NavLink to="/app/settings" className={link}><Settings size={20} /> Settings</NavLink>}
            <button type="button" onClick={toggle} className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 font-semibold transition hover:bg-card/70">
              <ThemeIcon size={20} /> {themeLabel}
            </button>
            <p className="space-x-3 px-4 pt-2 text-xs text-muted-foreground">
              <NavLink to="/privacy" className="underline">Privacy</NavLink>
              <NavLink to="/terms" className="underline">Terms</NavLink>
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 pb-28 md:p-8">
          <div key={location.pathname} className="page-in"><Outlet /></div>
        </main>

        {more && (
          <div className="fixed inset-x-3 bottom-24 z-20 grid grid-cols-2 gap-1 rounded-sticker border-2 border-border bg-card p-3 shadow-xl md:hidden">
            {moreItems.map((it) => (
              <NavLink key={it.to} to={it.to} end={isExact(it.to)} className={link}><it.icon size={18} /> {it.label} {lock(it)}</NavLink>
            ))}
            <button type="button" onClick={toggle} className="flex items-center gap-3 rounded-full px-4 py-2.5 font-semibold hover:bg-secondary">
              <ThemeIcon size={18} /> {themeLabel}
            </button>
          </div>
        )}

        <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-full border-2 border-border bg-card p-2 shadow-lg md:hidden">
          <NavLink to="/app" end className={({ isActive }) => tab(isActive)}><Home size={20} /> Home</NavLink>
          <NavLink to="/app/discover" className={({ isActive }) => tab(isActive)}><Compass size={20} /> Discover</NavLink>
          {guest ? (
            <Link to={`/login?next=${next}`} className={tab(false)}><LogIn size={20} /> Log in</Link>
          ) : (
            <>
              <NavLink to="/app/diary" className={({ isActive }) => tab(isActive)}><BookOpen size={20} /> Diary</NavLink>
              <NavLink to="/app/notifications" className={({ isActive }) => tab(isActive)}>
                <span className="relative"><Bell size={20} />
                  {unread > 0 && <span className="absolute -right-2 -top-1 rounded-full bg-berry px-1.5 text-[10px] font-bold text-onberry">{unread}</span>}
                </span> Alerts
              </NavLink>
            </>
          )}
          <button className={tab(more)} onClick={() => setMore((m) => !m)} aria-expanded={more}><Menu size={20} /> More</button>
        </nav>
      </div>
    </WatchlistProvider>
  );
}
