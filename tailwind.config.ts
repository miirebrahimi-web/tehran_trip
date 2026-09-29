import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        card: "var(--card)",
        soft: "var(--soft)",
        ink: "var(--ink)",
        mute: "var(--mute)",
        line: "var(--line)",
        brand: "var(--brand)",
        saffron: "var(--saffron)",
        tile: "var(--tile)",
      },
      boxShadow: { lift: "0 10px 30px -12px rgba(20,18,43,.35)" },
    },
  },
  plugins: [],
};
export default config;
