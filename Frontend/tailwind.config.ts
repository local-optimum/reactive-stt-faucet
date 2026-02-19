import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#00E5FF",
        "accent-purple": "#7C3AED",
        surface: "rgba(255, 255, 255, 0.05)",
        bg: "#080C14",
      },
    },
  },
  plugins: [],
};
export default config;
