import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

export default function Home() {
  const { profile } = useAuth();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl">Hi, {profile?.display_name ?? "there"}!</h1>
      {!profile?.couple_id ? (
        <div className="sticker-card flex items-center gap-4 p-6">
          <Heart className="shrink-0 text-berry" />
          <div className="flex-1">
            <h2 className="text-lg">Invite your partner</h2>
            <p className="text-muted-foreground">Pair up to unlock your shared watchlist, partner reviews and couple stats.</p>
          </div>
          <Link to="/onboarding" className="btn-primary">Pair up</Link>
        </div>
      ) : (
        <div className="sticker-card p-6">
          <h2 className="text-lg">You're paired up</h2>
          <p className="text-muted-foreground">Activity from both of you will show up here once you start logging movies.</p>
        </div>
      )}
    </div>
  );
}
