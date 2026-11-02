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
