import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Voltage design tokens
        night:       "#090B1A",
        deep:        "#121530",
        field:       "#0E1128",
        volt:        "#6A4CFF",
        arc:         "#2F6BFF",
        "arc-ink":   "#2A62F2",
        plasma:      "#2BE4FF",
        "white-hot": "#F2F6FF",
        mist:        "#A8B0D8",
        "volt-night":"#241D7A",
        "volt-deep": "#5636F0",
        "volt-mid":  "#8B6FFF",
        edge:        "#7B84B5",
        warn:        "#FF9A5C",
        paper:       "#F4F6FF",
        ink:         "#0E1030",
      },
      fontFamily: {
        display: ["var(--font-poppins)", "Poppins", "system-ui", "sans-serif"],
        sans:    ["var(--font-inter)",   "Inter",   "system-ui", "sans-serif"],
      },
      backgroundImage: {
        charge:       "linear-gradient(100deg, #6A4CFF, #2A62F2)",
        "charge-text":"linear-gradient(100deg, #6A4CFF, #2F6BFF 55%, #A88FFF)",
        "volt-wash":  "radial-gradient(100% 90% at 50% 0%, rgba(106,76,255,.55) 0%, rgba(106,76,255,0) 70%)",
      },
      boxShadow: {
        "glow-bar":    "0 0 0 4px rgba(106,76,255,.10), 0 18px 60px -18px rgba(106,76,255,.65)",
        "glow-bar-on": "0 0 0 5px rgba(43,228,255,.10), 0 18px 80px -10px rgba(47,107,255,.9)",
        "glow-btn":    "0 10px 32px -10px rgba(106,76,255,.8)",
        pop:           "0 24px 60px rgba(0,0,0,.55)",
        "focus-ring":  "0 0 0 4px rgba(106,76,255,.25)",
      },
      borderRadius: {
        pill: "999px",
        bar:  "26px",
        card: "18px",
      },
    },
  },
  plugins: [],
};
export default config;
