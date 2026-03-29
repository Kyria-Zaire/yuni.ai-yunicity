import type { Config } from "tailwindcss";

import {
  colors,
  radii,
  shadows,
  spacing,
} from "../../packages/design-tokens/src/tokens";

function flattenColors(): Record<string, string> {
  const out: Record<string, string> = {};
  const named = colors as Record<string, string | Record<string, string>>;
  for (const [name, val] of Object.entries(named)) {
    if (typeof val === "string") {
      out[`yuni-${name}`] = val;
    } else {
      for (const [shade, hex] of Object.entries(val)) {
        out[`yuni-${name}-${shade}`] = hex;
      }
    }
  }
  return out;
}

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ...flattenColors(),
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      borderRadius: {
        "yuni-sm": radii.sm,
        "yuni-md": radii.md,
        "yuni-lg": radii.lg,
        "yuni-xl": radii.xl,
        "yuni-full": radii.full,
      },
      spacing: {
        "yuni-xs": spacing.xs,
        "yuni-sm": spacing.sm,
        "yuni-md": spacing.md,
        "yuni-lg": spacing.lg,
        "yuni-xl": spacing.xl,
        "yuni-2xl": spacing["2xl"],
      },
      boxShadow: {
        "yuni-xs": shadows.xs,
        "yuni-sm": shadows.sm,
        "yuni-md": shadows.md,
        "yuni-lg": shadows.lg,
        "yuni-glow": shadows["terracotta-glow"],
        "yuni-terracotta-glow": shadows["terracotta-glow"],
      },
      fontFamily: {
        display: ["var(--font-display)", "georgia", "serif"],
        editorial: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        ticker: "ticker 30s linear infinite",
      },
      fontSize: {
        "editorial-xs": ["0.875rem", { lineHeight: "1.4" }],
        "editorial-sm": ["1rem", { lineHeight: "1.5" }],
        "editorial-base": ["1.125rem", { lineHeight: "1.6" }],
        "editorial-lg": ["1.5rem", { lineHeight: "1.3" }],
        "editorial-xl": ["2rem", { lineHeight: "1.2" }],
        "editorial-2xl": ["2.5rem", { lineHeight: "1.15" }],
        "editorial-3xl": ["3.5rem", { lineHeight: "1.1" }],
        "editorial-4xl": ["4.5rem", { lineHeight: "1.05" }],
      },
    },
  },
  plugins: [],
};
export default config;
