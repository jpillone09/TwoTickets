import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import ReviewCard from "../components/ReviewCard";
import type { ReviewRow } from "../lib/types";

type Tab = "all" | "mine" | "partner";

export default function Reviews() {
  const { session, profile } = useAuth();
  const uid = session!.user.id;
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("reviews")
      .select("*, movie:movies(id,title,poster_path,release_date), author:profiles!user_id(id,display_name,username)")
      .order("created_at", { ascending: false }).limit(50);
    if (error) setError(error.message);
    setRows((data ?? []) as unknown as ReviewRow[]);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = rows.filter((r) => tab === "all" || (tab === "mine") === (r.user_id === uid));
  const tabs: [Tab, string][] = [["all", "Everyone"], ["mine", "Mine"], ["partner", "Partner's"]];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl">Ratings &amp; reviews</h1>
      <div className="mt-4 flex gap-2">
        {tabs.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={tab === t ? "btn-primary" : "btn-soft"}>{label}</button>
        ))}
      </div>
      {error && <p role="alert" className="mt-4 font-semibold text-destructive">Couldn't load reviews: {error}</p>}
      <div className="mt-5 space-y-4">
        {loading && <p className="text-muted-foreground">Loading…</p>}
        {!loading && shown.length === 0 && (
          <p className="text-muted-foreground">
            {tab === "partner" && !profile?.couple_id
              ? "Pair up with your partner to see their reviews here."
              : "Nothing here yet. Open a movie from Discover and rate it."}
          </p>
        )}
        {shown.map((r) => <ReviewCard key={r.id} review={r} showMovie onChanged={load} />)}
      </div>
    </div>
  );
}
