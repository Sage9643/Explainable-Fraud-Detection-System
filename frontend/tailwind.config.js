/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        // Neutral structural scale - used for backgrounds, borders, text.
        // Kept separate from Tailwind's default "gray" so the palette can't
        // silently drift if someone reaches for gray-500 out of habit.
        surface: {
          light: "#ffffff",
          subtle: "#f7f8fa",
          DEFAULT: "#ffffff",
          dark: "#0d1117",
          "dark-subtle": "#161b22",
        },
        ink: {
          50: "#f6f7f9",
          100: "#eceef1",
          200: "#d5d9e0",
          300: "#b1b8c4",
          400: "#8891a1",
          500: "#646d7d",
          600: "#4b5262",
          700: "#363c49",
          800: "#22262f",
          900: "#14161b",
        },
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          400: "#5b8def",
          500: "#3568d4",
          600: "#2851ac",
          700: "#1f3f87",
        },
        // Semantic risk palette - the ONLY place risk colors are defined.
        // Every chart/badge/component pulls from here via utils/riskColors.js.
        risk: {
          low: "#0f9d58",
          medium: "#d9a404",
          high: "#e8720c",
          critical: "#d93025",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(20, 22, 27, 0.05), 0 1px 1px 0 rgba(20, 22, 27, 0.03)",
      },
      borderRadius: {
        card: "8px",
      },
    },
  },
  plugins: [],
};
