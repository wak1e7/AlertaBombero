import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        emergency: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#EF4444",
          600: "#D62828",
          700: "#B91C1C"
        },
        surface: "#FFFFFF",
        app: "#F8FAFC",
        ink: "#111827",
        muted: "#6B7280",
        success: "#16A34A",
        info: "#2563EB",
        warning: "#F59E0B"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(17, 24, 39, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
