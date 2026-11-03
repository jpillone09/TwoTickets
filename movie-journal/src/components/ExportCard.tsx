import { useState } from "react";
import { Download } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { exportAllJson, exportDiaryCsv } from "../lib/exportData";

export default function ExportCard() {
  const { session } = useAuth();
  const uid = session!.user.id;
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function run(kind: "csv" | "json") {
    setError(""); setBusy(kind);
    try { await (kind === "csv" ? exportDiaryCsv(uid) : exportAllJson(uid)); }
    catch (e) { setError((e as Error).message); }
    setBusy("");
  }

  return (
    <div className="sticker-card p-6">
      <h2 className="text-lg">Your data</h2>
      <p className="text-muted-foreground">Download a copy of everything you've logged. It's yours.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn-soft" disabled={!!busy} onClick={() => run("csv")}><Download size={16} /> {busy === "csv" ? "Preparing…" : "Diary (CSV)"}</button>
        <button className="btn-soft" disabled={!!busy} onClick={() => run("json")}><Download size={16} /> {busy === "json" ? "Preparing…" : "Everything (JSON)"}</button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}
