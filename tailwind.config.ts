import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2563EB",
          navy: "#0F172A",
          slate: "#1E293B",
          gray: "#CBD5E1",
          white: "#F8FAFC",
          green: "#10B981",
          orange: "#F97316",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
      },
      boxShadow: {
        card: "0 20px 45px -25px rgba(15, 23, 42, 0.55)",
        "card-soft": "0 12px 32px -20px rgba(15, 23, 42, 0.6)",
      },
      borderRadius: {
        "2xl": "1.25rem",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
