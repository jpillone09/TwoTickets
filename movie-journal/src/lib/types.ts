export type ReviewRow = {
  id: string;
  user_id: string;
  movie_id: number;
  rating: number | null;
  body: string | null;
  contains_spoilers: boolean;
  tags: string[];
  created_at: string;
  movie?: { id: number; title: string; poster_path: string | null; release_date: string | null } | null;
  author?: { id: string; display_name: string | null; username: string } | null;
};

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export function timeAgo(d: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return days < 7 ? `${days}d ago` : fmtDate(d);
}
