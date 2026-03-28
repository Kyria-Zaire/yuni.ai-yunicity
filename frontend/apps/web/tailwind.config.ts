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
        editorial: ["var(--font-editorial)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
