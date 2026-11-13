import { Check, Monitor, Moon, Sun } from "lucide-react";
import { hexToHue, hueToHex, PRESETS, useTheme, type Mode } from "../lib/theme";

const MODES: [Mode, string, typeof Sun][] = [["light", "Light", Sun], ["dark", "Dark", Moon], ["system", "Auto", Monitor]];

export default function AppearanceCard() {
  const { mode, hue, setMode, setHue, reset } = useTheme();
  const isPreset = PRESETS.some((p) => p.hue === hue);

  return (
    <div className="sticker-card space-y-5 p-6">
      <div>
        <h2 className="text-lg">Appearance</h2>
        <p className="text-muted-foreground">Choose light or dark, and pick the color you like. It's saved on this device.</p>
      </div>

      <div role="group" aria-label="Theme mode" className="flex flex-wrap gap-2">
        {MODES.map(([m, label, Icon]) => (
          <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)} className={mode === m ? "btn-primary" : "btn-soft"}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-2 font-semibold">Color</p>
        <div role="group" aria-label="Accent color" className="flex flex-wrap items-center gap-3">
          {PRESETS.map((p) => (
            <button key={p.name} onClick={() => setHue(p.hue)} aria-pressed={hue === p.hue} aria-label={p.name} title={p.name}
              className={`flex h-11 w-11 items-center justify-center rounded-full border-4 shadow-md transition hover:scale-110 ${hue === p.hue ? "border-foreground" : "border-card"}`}
              style={{ background: `hsl(${p.hue} 82% 73%)` }}>
              {hue === p.hue && <Check size={18} className="text-[#3b2b33]" />}
            </button>
          ))}
          <label title="Pick your own color"
            className={`flex h-11 cursor-pointer items-center gap-2 rounded-full border-2 px-3 text-sm font-semibold ${!isPreset ? "border-foreground" : "border-border"}`}>
            <input type="color" value={hueToHex(hue)} onChange={(e) => { const h = hexToHue(e.target.value); if (h !== null) setHue(h); }}
              className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0" aria-label="Custom color" />
            Custom
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">We use the shade you choose and keep the soft pastel look, so every color stays easy on the eyes.</p>
      </div>

      <div className="rounded-sticker bg-secondary p-4">
        <p className="mb-2 text-sm font-semibold text-muted-foreground">Preview</p>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-primary" type="button">Button</button>
          <button className="btn-soft" type="button">Soft button</button>
          <span className="chip !bg-accent">Partner</span>
          <span className="chip !bg-butter">Highlight</span>
          <span className="font-bold text-berry">Link color</span>
        </div>
      </div>

      <button className="btn-soft" onClick={reset}>Reset to default</button>
    </div>
  );
}
