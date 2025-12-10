import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        night: {
          50: "#f4f7fb",
          100: "#dfe7f3",
          200: "#bfd0e7",
          300: "#96afd8",
          400: "#6a86c3",
          500: "#4d66af",
          600: "#3e4f94",
          700: "#364074",
          800: "#2c345b",
          900: "#222946",
          950: "#0b1120",
        },
        brand: {
          sky: "#38bdf8",
          indigo: "#6366f1",
          azure: "#60a5fa",
          blue: "#0f172a",
          slate: "#94a3b8",
        },
        surface: {
          base: "rgba(10, 16, 32, 0.95)",
          subtle: "rgba(16, 24, 45, 0.88)",
          elevated: "rgba(26, 36, 63, 0.9)",
          highlight: "rgba(148, 197, 255, 0.14)",
        },
        stroke: {
          subtle: "rgba(148, 163, 184, 0.22)",
          strong: "rgba(148, 163, 184, 0.38)",
          glow: "rgba(99, 102, 241, 0.45)",
        },
        indigo: {
          950: "#050618",
        },
        "card-border": "rgba(148, 163, 184, 0.15)",
        "card-surface": "rgba(15, 23, 42, 0.8)",
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        "4xl": "2.5rem",
      },
      boxShadow: {
        glow: "0 20px 80px rgba(15, 23, 42, 0.45)",
        focus: "0 0 0 3px rgba(56, 189, 248, 0.35)",
      },
      dropShadow: {
        neon: "0 10px 35px rgba(56, 189, 248, 0.25)",
      },
      backgroundImage: {
        "radial-night":
          "radial-gradient(ellipse at top, rgba(56,189,248,0.25), transparent)",
        "grid-slate":
          "linear-gradient(rgba(148,163,184,0.07) 1px, transparent 0), linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 0)",
        "hero-glow":
          "radial-gradient(circle at 20% 20%, rgba(56,189,248,0.35), transparent 50%), radial-gradient(circle at 80% 0%, rgba(99,102,241,0.35), transparent 45%)",
        "noise-light":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E\")",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" },
        },
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: 0.35 },
          "50%": { opacity: 0.8 },
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "fade-up": "fade-up 0.5s ease forwards",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
