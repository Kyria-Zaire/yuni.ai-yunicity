export const colors = {
  terracotta: {
    50: "#FDF0EB",
    100: "#FAD5C4",
    300: "#F0946A",
    500: "#C1440E",
    700: "#8B2F08",
    900: "#4A1604",
  },
  slate: {
    50: "#F0F2F4",
    100: "#D4DAE2",
    300: "#8E9BB0",
    500: "#4A6FA5",
    700: "#2E4A75",
    900: "#1A2C47",
  },
  forest: {
    50: "#EBF5EE",
    100: "#C3E0CC",
    300: "#72B885",
    500: "#2D6A4F",
    700: "#1B4733",
    900: "#0D2419",
  },
  wheat: {
    50: "#FDFAF5",
    100: "#F7F0E0",
    300: "#EDD9A8",
    500: "#D4B483",
  },
  aiPulse: "#6B8CFF",
  vitalityHigh: "#40C97F",
  vitalityLow: "#E05A3A",
  success: "#2D6A4F",
  warning: "#D4841A",
  error: "#C1440E",
  info: "#4A6FA5",
} as const;

export const typography = {
  fontEditorial: "'Cormorant Garamond', Georgia, serif",
  fontBody: "'Outfit', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', monospace",
  sizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "2rem",
    "4xl": "2.5rem",
  },
} as const;

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "40px",
  "2xl": "64px",
} as const;

export const radii = {
  sm: "4px",
  md: "8px",
  lg: "16px",
  xl: "24px",
  full: "9999px",
} as const;

export const shadows = {
  xs: "0 1px 2px rgba(26,44,71,0.04)",
  sm: "0 1px 4px rgba(26,44,71,0.06)",
  md: "0 4px 12px rgba(26,44,71,0.08)",
  lg: "0 8px 24px rgba(26,44,71,0.10)",
  "terracotta-glow": "0 0 20px rgba(193,68,14,0.12)",
} as const;
