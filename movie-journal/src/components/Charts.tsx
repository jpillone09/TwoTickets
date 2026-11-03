export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="sticker-card p-4 text-center">
      <p className="font-heading text-3xl font-bold text-berry">{value}</p>
      <p className="text-sm font-semibold">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Columns({ data }: { data: [string, number][] }) {
  const max = Math.max(1, ...data.map((d) => d[1]));
  return (
    <div className="flex h-44 items-end gap-1.5" role="img" aria-label={data.map(([l, v]) => `${l}: ${v}`).join(", ")}>
      {data.map(([label, v]) => (
        <div key={label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span className="text-xs font-bold">{v || ""}</span>
          <div className="w-full rounded-t-lg bg-primary" style={{ height: `${(v / max) * 75}%`, minHeight: v ? 4 : 0 }} />
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

/** items: [label, value, optional text to display instead of the raw value] */
export function BarList({ items, empty = "Not enough data yet." }: { items: [string, number, string?][]; empty?: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...items.map((i) => i[1]), 0.0001);
  return (
    <ul className="space-y-2">
      {items.map(([label, v, text]) => (
        <li key={label} className="text-sm">
          <div className="flex justify-between font-semibold"><span>{label}</span><span>{text ?? v}</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(v / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="sticker-card p-5"><h2 className="mb-3 text-lg">{title}</h2>{children}</section>;
}
