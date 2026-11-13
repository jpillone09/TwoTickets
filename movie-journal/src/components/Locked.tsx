import { Link, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";

/** Shown instead of a members-only page when you're not signed in. */
export default function Locked({ feature, blurb }: { feature: string; blurb: string }) {
  const loc = useLocation();
  const next = encodeURIComponent(loc.pathname + loc.search);
  return (
    <div className="sticker-card mx-auto mt-10 max-w-lg p-8 text-center">
      <Lock className="mx-auto mb-3 text-berry" />
      <h1 className="text-2xl">Log in to see {feature}</h1>
      <p className="mt-2 text-muted-foreground">{blurb}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link to={`/signup?next=${next}`} className="btn-primary">Sign up free</Link>
        <Link to={`/login?next=${next}`} className="btn-soft">Log in</Link>
      </div>
      <p className="mt-4 text-sm"><Link to="/app/discover" className="font-semibold text-berry underline">Keep browsing movies</Link></p>
    </div>
  );
}
