import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3, Bell, BookOpen, Clapperboard, Compass, Heart, Home, ListPlus, ListVideo, Menu,
  MessageSquareHeart, Settings, Sparkles, UserRound, Users,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { APP_NAME } from "../lib/brand";
import { WatchlistProvider } from "../lib/WatchlistContext";

const nav = [
  { to: "/app", label: "Home", icon: Home, end: true },
  { to: "/app/discover", label: "Discover", icon: Compass },
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

export default function AppLayout() {
  const { profile, session } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [more, setMore] = useState(false);
  const uid = session!.user.id;

  const refresh = useCallback(async () => {
    const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true })
      .eq("user_id", uid).is("read_at", null);
    setUnread(count ?? 0);
  }, [uid]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    window.addEventListener("notifications-changed", refresh);
    return () => { clearInterval(t); window.removeEventListener("notifications-changed", refresh); };
  }, [refresh, location.pathname]);

  useEffect(() => setMore(false), [location.pathname]);

  const badge = (to: string) =>
    to === "/app/notifications" && unread > 0
      ? <span className="ml-auto rounded-full bg-berry px-2 text-xs font-bold text-white">{unread}</span> : null;

  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-full px-4 py-2.5 font-semibold transition ${
      isActive ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-white/70"
    }`;
  const profilePath = `/app/u/${profile?.username ?? ""}`;
  const tab = (isActive: boolean) =>
    `flex flex-col items-center rounded-full px-3 py-1 text-xs font-semibold ${isActive ? "bg-primary text-primary-foreground" : ""}`;

  return (
    <WatchlistProvider>
    <div className="min-h-screen md:flex">
      <aside className="hidden w-64 shrink-0 flex-col gap-1 border-r-2 border-border bg-secondary p-4 md:flex">
        <div className="mb-4 flex items-center gap-2 px-2 font-heading text-xl font-bold">
          <Clapperboard className="text-berry" /> {APP_NAME}
        </div>
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={link}>
            <Icon size={20} /> {label} {badge(to)}
          </NavLink>
        ))}
        <div className="mt-auto space-y-1">
          <NavLink to={profilePath} className={link}><UserRound size={20} /> Profile</NavLink>
          <NavLink to="/app/settings" className={link}><Settings size={20} /> Settings</NavLink>
        </div>
      </aside>

      <main className="flex-1 p-4 pb-28 md:p-8"><Outlet /></main>

      {more && (
        <div className="fixed inset-x-3 bottom-24 z-20 grid grid-cols-2 gap-1 rounded-sticker border-2 border-border bg-card p-3 shadow-xl md:hidden">
          {[...nav.filter((n) => !["/app", "/app/discover", "/app/diary", "/app/notifications"].includes(n.to)),
            { to: profilePath, label: "Profile", icon: UserRound },
            { to: "/app/settings", label: "Settings", icon: Settings }].map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={link}><Icon size={18} /> {label}</NavLink>
          ))}
        </div>
      )}

      <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-full border-2 border-border bg-card p-2 shadow-lg md:hidden">
        <NavLink to="/app" end className={({ isActive }) => tab(isActive)}><Home size={20} /> Home</NavLink>
        <NavLink to="/app/discover" className={({ isActive }) => tab(isActive)}><Compass size={20} /> Discover</NavLink>
        <NavLink to="/app/diary" className={({ isActive }) => tab(isActive)}><BookOpen size={20} /> Diary</NavLink>
        <NavLink to="/app/notifications" className={({ isActive }) => tab(isActive)}>
          <span className="relative"><Bell size={20} />
            {unread > 0 && <span className="absolute -right-2 -top-1 rounded-full bg-berry px-1.5 text-[10px] font-bold text-white">{unread}</span>}
          </span> Alerts
        </NavLink>
        <button className={tab(more)} onClick={() => setMore((m) => !m)} aria-expanded={more}><Menu size={20} /> More</button>
      </nav>
    </div>
    </WatchlistProvider>
  );
}
