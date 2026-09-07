import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fluvial: "#0ea5e9",
        rodoviario: "#f59e0b",
      },
    },
  },
  plugins: [],
};
export default config;
