import type { Config } from "tailwindcss";
const v = (n: string) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: v("bg"), bg2: v("bg2"), card: v("card"), light: v("light"),
        accent: v("accent"), accent2: v("accent2"), deep: v("deep"),
        ink: v("ink"), muted: v("muted"), line: v("line"),
      },
      fontFamily: { sans: ["var(--font-sans)", "Manrope", "Inter", "system-ui", "sans-serif"] },
      borderRadius: { "2xl": "1.25rem", "3xl": "1.75rem" },
      boxShadow: { soft: "0 1px 2px rgb(84 127 175 / .06), 0 8px 28px -12px rgb(84 127 175 / .22)" },
    },
  },
  plugins: [],
} satisfies Config;
