import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import AppLayout from "./components/AppLayout";
import Stub from "./components/Stub";
import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import ResetPassword from "./pages/ResetPassword";
import { Privacy, Terms } from "./pages/Legal";
import Stats from "./pages/Stats";
import CoupleStats from "./pages/CoupleStats";
import Recap from "./pages/Recap";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import ForYou from "./pages/ForYou";
import Watchlist from "./pages/Watchlist";
import Lists from "./pages/Lists";
import Diary from "./pages/Diary";
import Reviews from "./pages/Reviews";
import Discover from "./pages/Discover";
import MovieDetail from "./pages/MovieDetail";
import Settings from "./pages/Settings";

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <p className="p-10 text-center font-heading">Loading…</p>;
  return session ? <>{children}</> : <Navigate to="/login" replace />;
}

const stubs: [string, string, string][] = [
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
      <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Home />} />
        <Route path="stats" element={<Stats />} />
        <Route path="stats/couple" element={<CoupleStats />} />
        <Route path="stats/recap" element={<Recap />} />
        <Route path="u/:username" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="for-you" element={<ForYou />} />
        <Route path="watchlist" element={<Watchlist kind="personal" />} />
        <Route path="shared" element={<Watchlist kind="shared" />} />
        <Route path="lists" element={<Lists />} />
        <Route path="diary" element={<Diary />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="discover" element={<Discover />} />
        <Route path="movie/:id" element={<MovieDetail />} />
        {stubs.map(([path, title, note]) => (
          <Route key={path} path={path} element={<Stub title={title} note={note} />} />
        ))}
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
