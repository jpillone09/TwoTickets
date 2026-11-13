import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Mode = "light" | "dark" | "system";
type Saved = { mode: Mode; hue: number };

const KEY = "twotickets-theme";
export const DEFAULT_HUE = 338; // strawberry pink
export const PRESETS: { name: string; hue: number }[] = [
  { name: "Strawberry", hue: 338 }, { name: "Peach", hue: 20 }, { name: "Honey", hue: 42 }, { name: "Mint", hue: 158 },
  { name: "Sky", hue: 200 }, { name: "Lavender", hue: 268 }, { name: "Lilac", hue: 292 },
];

function load(): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    const mode: Mode = ["light", "dark", "system"].includes(v?.mode) ? v.mode : "light";
    const hue = typeof v?.hue === "number" && v.hue >= 0 && v.hue <= 360 ? Math.round(v.hue) : DEFAULT_HUE;
    return { mode, hue };
  } catch {
    return { mode: "light", hue: DEFAULT_HUE };
  }
}

const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
const isDark = (m: Mode) => (m === "system" ? systemDark() : m === "dark");

/** Builds every colour token from one hue. The default hue uses the values in index.css instead. */
function palette(h: number, dark: boolean): Record<string, string> {
  const c = (hh: number, s: number, l: number) => `${hh} ${s}% ${l}%`;
  const a = (h + 219) % 360; // companion hue: 338 -> 197 (the cloud blue used for "your partner")
  return dark ? {
    background: c(h, 25, 10), foreground: c(h, 45, 94), card: c(h, 22, 14),
    primary: c(h, 82, 73), "primary-foreground": c(h, 35, 14), secondary: c(h, 26, 19), "secondary-foreground": c(h, 45, 94),
    muted: c(h, 20, 17), "muted-foreground": c(h, 15, 70), accent: c(a, 35, 28), "accent-foreground": c(a, 50, 92),
    border: c(h, 15, 26), ring: c(h, 85, 76), berry: c(h, 85, 76), "on-berry": c(h, 35, 14), butter: "45 45% 26%",
    destructive: "0 75% 65%", shadow: c(h, 40, 22), dots: `${h} 40% 30% / 0.3`,
  } : {
    background: c(h, 100, 98), foreground: c(h, 13, 31), card: "0 0% 100%",
    primary: c(h, 82, 73), "primary-foreground": c(h, 30, 18), secondary: c(h, 100, 95), "secondary-foreground": c(h, 13, 31),
    muted: c(h, 60, 96), "muted-foreground": c(h, 10, 44), accent: c(a, 62, 84), "accent-foreground": c(h, 13, 25),
    border: c(h, 20, 88), ring: c(h, 62, 59), berry: c(h, 62, 59), "on-berry": "0 0% 100%", butter: "49 100% 85%",
    destructive: "0 72% 55%", shadow: c(h, 82, 88), dots: `${h} 82% 90% / 0.5`,
  };
}

export function applyTheme({ mode, hue }: Saved) {
  const dark = isDark(mode);
  const root = document.documentElement;
  root.dataset.theme = dark ? "dark" : "light";
  root.style.colorScheme = dark ? "dark" : "light";
  Object.entries(palette(hue, dark)).forEach(([k, v]) =>
    hue === DEFAULT_HUE ? root.style.removeProperty(`--${k}`) : root.style.setProperty(`--${k}`, v));
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#1f131a" : "#FFE6EE");
}

/** Call once before React renders, so there is no flash of the wrong theme. */
export const applyInitialTheme = () => applyTheme(load());

export function hexToHue(hex: string): number | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  if (d < 0.05) return null; // grey: no meaningful hue
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (Math.round(h * 60) + 360) % 360;
}

export function hueToHex(h: number) {
  const s = 0.82, l = 0.73, a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1))))).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

type Ctx = {
  mode: Mode; hue: number; resolved: "light" | "dark";
  setMode: (m: Mode) => void; setHue: (h: number) => void; toggle: () => void; reset: () => void;
};
const ThemeCtx = createContext<Ctx>(null!);
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(load);
  const [, tick] = useState(0);

  useEffect(() => {
    applyTheme(saved);
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* private mode: just don't remember */ }
  }, [saved]);

  useEffect(() => {
    if (saved.mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => { applyTheme(saved); tick((n) => n + 1); };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [saved]);

  const resolved = isDark(saved.mode) ? "dark" : "light";
  const setMode = useCallback((mode: Mode) => setSaved((s) => ({ ...s, mode })), []);
  const setHue = useCallback((hue: number) => setSaved((s) => ({ ...s, hue })), []);
  const toggle = useCallback(() => setSaved((s) => ({ ...s, mode: isDark(s.mode) ? "light" : "dark" })), []);
  const reset = useCallback(() => setSaved({ mode: "light", hue: DEFAULT_HUE }), []);
  const value = useMemo(() => ({ mode: saved.mode, hue: saved.hue, resolved, setMode, setHue, toggle, reset }),
    [saved, resolved, setMode, setHue, toggle, reset]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
