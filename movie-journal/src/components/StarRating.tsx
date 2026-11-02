import { Star } from "lucide-react";

/** Read-only stars, supports halves (e.g. 3.5). */
export function Stars({ value, size = 18 }: { value: number | null; size?: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={value ? `${value} out of 5 stars` : "No rating"}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, (value ?? 0) - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-primary/40" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="fill-primary text-primary" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Click the left half of a star for .5, the right half for a whole star. Click again to clear. */
export function StarInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const halves = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
  return (
    <div className="relative inline-flex">
      <Stars value={value} size={34} />
      <div className="absolute inset-0 flex">
        {halves.map((v) => (
          <button key={v} type="button" aria-label={`${v} stars`} className="h-full flex-1"
            onClick={() => onChange(value === v ? null : v)} />
        ))}
      </div>
    </div>
  );
}
