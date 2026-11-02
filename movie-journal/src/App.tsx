import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import AppLayout from "./components/AppLayout";
import Stub from "./components/Stub";
import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
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
  ["watchlist", "My watchlist", "Your own list of movies to watch. Coming in Phase 5."],
  ["shared", "Our watchlist", "Movies you and your partner want to watch together. Coming in Phase 5."],
  ["for-you", "For you", "Recommendations, including ones from your partner. Coming in Phase 6."],
  ["stats", "Your stats", "Charts built from your diary. Coming in Phase 7."],
  ["stats/couple", "Our stats", "Movies watched together and rating comparisons. Coming in Phase 7."],
  ["u/:username", "Profile", "Profiles are coming in Phase 6."],
];

export default function App() {
  const { session, loading } = useAuth();
  return (
    <Routes>
      <Route path="/" element={!loading && session ? <Navigate to="/app" replace /> : <Landing />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
      <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Home />} />
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
