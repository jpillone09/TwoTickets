import type { Config } from "tailwindcss";

const v = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Zen Maru Gothic"', "Nunito", "sans-serif"],
        body: ["Nunito", "system-ui", "sans-serif"],
        hand: ["Yomogi", "cursive"],
      },
      colors: {
        background: v("background"),
        foreground: v("foreground"),
        card: v("card"),
        primary: { DEFAULT: v("primary"), foreground: v("primary-foreground") },
        secondary: { DEFAULT: v("secondary"), foreground: v("secondary-foreground") },
        muted: { DEFAULT: v("muted"), foreground: v("muted-foreground") },
        accent: { DEFAULT: v("accent"), foreground: v("accent-foreground") },
        destructive: v("destructive"),
        border: v("border"),
        ring: v("ring"),
        berry: v("berry"),
        butter: v("butter"),
      },
      borderRadius: { sticker: "1.25rem" },
    },
  },
  plugins: [],
} satisfies Config;
