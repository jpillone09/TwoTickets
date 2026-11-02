import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3, BookOpen, Clapperboard, Compass, Heart, Home, ListVideo, MessageSquareHeart,
  Settings, Sparkles, UserRound, Users,
} from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { APP_NAME } from "../lib/brand";

const nav = [
  { to: "/app", label: "Home", icon: Home, end: true },
  { to: "/app/discover", label: "Discover", icon: Compass },
  { to: "/app/watchlist", label: "My watchlist", icon: ListVideo },
  { to: "/app/shared", label: "Our watchlist", icon: Heart },
  { to: "/app/diary", label: "Diary", icon: BookOpen },
  { to: "/app/reviews", label: "Reviews", icon: MessageSquareHeart },
  { to: "/app/for-you", label: "For you", icon: Sparkles },
  { to: "/app/stats", label: "Your stats", icon: BarChart3 },
  { to: "/app/stats/couple", label: "Our stats", icon: Users },
];

const mobileNav = [nav[0], nav[1], nav[4], nav[3], { to: "/app/settings", label: "More", icon: Settings }];

export default function AppLayout() {
  const { profile } = useAuth();
  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-full px-4 py-2.5 font-semibold transition ${
      isActive ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-white/70"
    }`;

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-64 shrink-0 flex-col gap-1 border-r-2 border-border bg-secondary p-4 md:flex">
        <div className="mb-4 flex items-center gap-2 px-2 font-heading text-xl font-bold">
          <Clapperboard className="text-berry" /> {APP_NAME}
        </div>
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={link}>
            <Icon size={20} /> {label}
          </NavLink>
        ))}
        <div className="mt-auto space-y-1">
          <NavLink to={`/app/u/${profile?.username ?? ""}`} className={link}>
            <UserRound size={20} /> Profile
          </NavLink>
          <NavLink to="/app/settings" className={link}>
            <Settings size={20} /> Settings
          </NavLink>
        </div>
      </aside>

      <main className="flex-1 p-4 pb-28 md:p-8">
        <Outlet />
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-10 flex justify-around rounded-full border-2 border-border bg-card p-2 shadow-lg md:hidden">
        {mobileNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/app"}
            className={({ isActive }) =>
              `flex flex-col items-center rounded-full px-3 py-1 text-xs font-semibold ${
                isActive ? "bg-primary text-primary-foreground" : ""
              }`
            }
          >
            <Icon size={20} /> {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
