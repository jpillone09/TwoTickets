import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import AppLayout from "./components/AppLayout";
import Locked from "./components/Locked";
import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import ResetPassword from "./pages/ResetPassword";
import { Privacy, Terms } from "./pages/Legal";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import GuestHome from "./pages/GuestHome";
import Discover from "./pages/Discover";
import MovieDetail from "./pages/MovieDetail";
import Watchlist from "./pages/Watchlist";
import Lists from "./pages/Lists";
import Diary from "./pages/Diary";
import Reviews from "./pages/Reviews";
import Notifications from "./pages/Notifications";
import ForYou from "./pages/ForYou";
import Stats from "./pages/Stats";
import CoupleStats from "./pages/CoupleStats";
import Recap from "./pages/Recap";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <p className="p-10 text-center font-heading">Loading…</p>;
  return session ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Visitors see a friendly "log in to use this" page instead of the feature. */
function Gate({ feature, blurb, children }: { feature: string; blurb: string; children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="skeleton mx-auto mt-10 h-48 max-w-lg rounded-sticker" />;
  return session ? <>{children}</> : <Locked feature={feature} blurb={blurb} />;
}

function HomeRoute() {
  const { session, loading } = useAuth();
  if (loading) return null;
  return session ? <Home /> : <GuestHome />;
}

const members: { path: string; feature: string; blurb: string; el: ReactNode }[] = [
  { path: "watchlist", feature: "your watchlist", blurb: "Save movies you want to watch, add notes and priorities, and see what your partner has already seen.", el: <Watchlist kind="personal" /> },
  { path: "shared", feature: "your shared watchlist", blurb: "Build one watchlist together, then let the app pick tonight's movie for you both.", el: <Watchlist kind="shared" /> },
  { path: "diary", feature: "your diary", blurb: "Keep a diary of every movie you watch, with ratings, reviews and rewatches.", el: <Diary /> },
  { path: "reviews", feature: "ratings and reviews", blurb: "Read your own ratings and reviews, and your partner's, side by side.", el: <Reviews /> },
  { path: "for-you", feature: "your recommendations", blurb: "Get movie suggestions from your partner and picks based on what you both love.", el: <ForYou /> },
  { path: "lists", feature: "your lists", blurb: "Make custom lists like Horror Night or Comfort Movies.", el: <Lists /> },
  { path: "stats", feature: "your stats", blurb: "See what you watch: hours, genres, directors, streaks and more.", el: <Stats /> },
  { path: "stats/couple", feature: "your couple stats", blurb: "See what you watch together, and where your tastes agree and disagree.", el: <CoupleStats /> },
  { path: "stats/recap", feature: "your yearly recap", blurb: "Get a recap of your movie year.", el: <Recap /> },
  { path: "notifications", feature: "your notifications", blurb: "Find out when your partner logs, reviews or recommends a movie.", el: <Notifications /> },
  { path: "u/:username", feature: "profiles", blurb: "View your profile and your partner's.", el: <Profile /> },
  { path: "settings", feature: "your settings", blurb: "Manage your account, appearance and data.", el: <Settings /> },
];

export default function App() {
  const { session, loading } = useAuth();
  return (
    <Routes>
      <Route path="/" element={!loading && session ? <Navigate to="/app" replace /> : <Landing />} />
      <Route path="/login" element={<AuthPage key="login" mode="login" />} />
      <Route path="/signup" element={<AuthPage key="signup" mode="signup" />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<HomeRoute />} />
        <Route path="discover" element={<Discover />} />
        <Route path="movie/:id" element={<MovieDetail />} />
        {members.map(({ path, feature, blurb, el }) => (
          <Route key={path} path={path} element={<Gate feature={feature} blurb={blurb}>{el}</Gate>} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
