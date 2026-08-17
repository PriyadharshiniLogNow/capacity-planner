import type { Config } from "tailwindcss";

/**
 * Tailwind CSS v4 config (optional JS layer).
 * Design tokens primarily live in app/globals.css via @theme.
 * This file is loaded through `@config` in globals.css.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        border: "var(--border)",
        muted: "var(--muted)",
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
          foreground: "var(--accent-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          text: "var(--sidebar-text)",
          hover: "var(--sidebar-hover)",
          active: "var(--sidebar-active)",
        },
        utilization: {
          under: "var(--util-under)",
          partial: "var(--util-partial)",
          well: "var(--util-well)",
          warning: "var(--util-warning)",
          critical: "var(--util-critical)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
