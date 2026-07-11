import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        emergency: {
          50: "#FFF3F2",
          100: "#FFE3E0",
          200: "#FFC8C2",
          500: "#F22924",
          600: "#DD1714",
          700: "#B81815"
        },
        surface: "#FFFFFF",
        app: "#FCFCFD",
        ink: "#1B1D22",
        muted: "#70757E",
        success: "#16A15A",
        info: "#2879E7",
        warning: "#D97706"
      },
      boxShadow: {
        soft: "0 3px 14px rgba(31, 38, 51, 0.07)",
        floating: "0 12px 28px rgba(31, 38, 51, 0.13)"
      }
    }
  },
  plugins: []
} satisfies Config;
