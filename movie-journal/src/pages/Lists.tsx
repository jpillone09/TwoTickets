import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import { img } from "../lib/tmdb";

type ListRow = {
  id: string; name: string; description: string | null;
  items: { movie_id: number; movie: { id: number; title: string; poster_path: string | null } }[];
};
const IDEAS = ["Horror Night", "Romance Movies", "Must Watch", "Weekend Movies", "Comfort Movies"];

export default function Lists() {
  const { session } = useAuth();
  const uid = session!.user.id;
  const [lists, setLists] = useState<ListRow[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("movie_lists")
      .select("id,name,description,items:movie_list_items(movie_id,movie:movies(id,title,poster_path))")
      .eq("user_id", uid).order("created_at");
    setLists((data ?? []) as unknown as ListRow[]);
  }, [uid]);
  useEffect(() => { load(); }, [load]);

  async function create(n: string, d = "") {
    setError("");
    if (!n.trim()) return;
    const { error } = await supabase.from("movie_lists").insert({ user_id: uid, name: n.trim(), description: d.trim() || null });
    if (error) return setError(error.message);
    setName(""); setDesc(""); load();
  }
  const submit = (e: FormEvent) => { e.preventDefault(); create(name, desc); };

  async function deleteList(id: string) {
    if (!confirm("Delete this list? The movies themselves aren't affected.")) return;
    await supabase.from("movie_lists").delete().eq("id", id);
    load();
  }
  async function removeItem(listId: string, movieId: number) {
    await supabase.from("movie_list_items").delete().eq("list_id", listId).eq("movie_id", movieId);
    load();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl">My lists</h1>
      <form onSubmit={submit} className="sticker-card mt-4 space-y-3 p-5">
        <div className="flex flex-wrap gap-2">
          <input className="input flex-1" placeholder="New list name (e.g. Comfort Movies)" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          <button className="btn-primary"><Plus size={18} /> Create</button>
        </div>
        <input className="input" placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-muted-foreground">Ideas:</span>
          {IDEAS.filter((i) => !lists.some((l) => l.name === i)).map((i) => (
            <button type="button" key={i} className="chip" onClick={() => create(i)}>+ {i}</button>
          ))}
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
      </form>

      {lists.length === 0 && <p className="mt-6 text-muted-foreground">No lists yet. Create one, then add movies from any movie page.</p>}
      <div className="mt-6 space-y-5">
        {lists.map((l) => (
          <section key={l.id} className="sticker-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl">{l.name} <span className="text-sm font-normal text-muted-foreground">· {l.items.length} movie{l.items.length === 1 ? "" : "s"}</span></h2>
                {l.description && <p className="text-sm text-muted-foreground">{l.description}</p>}
              </div>
              <button aria-label={`Delete ${l.name}`} className="text-muted-foreground hover:text-destructive" onClick={() => deleteList(l.id)}><Trash2 size={18} /></button>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {l.items.map((it) => (
                <div key={it.movie_id} className="relative w-24">
                  <Link to={`/app/movie/${it.movie_id}`} title={it.movie.title}>
                    {it.movie.poster_path
                      ? <img src={img(it.movie.poster_path, "w185")!} alt={it.movie.title} className="aspect-[2/3] rounded-lg border-2 border-white object-cover shadow" />
                      : <div className="flex aspect-[2/3] items-center justify-center rounded-lg bg-secondary p-1 text-center text-xs">{it.movie.title}</div>}
                  </Link>
                  <button aria-label={`Remove ${it.movie.title}`} onClick={() => removeItem(l.id, it.movie_id)}
                    className="absolute -right-2 -top-2 rounded-full bg-card p-1 shadow"><X size={14} /></button>
                </div>
              ))}
              {l.items.length === 0 && <p className="text-sm text-muted-foreground">Empty. Open a movie and tap this list's name to add it.</p>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
