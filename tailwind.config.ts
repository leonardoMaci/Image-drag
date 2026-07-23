import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        board: {
          bg: "#f8fafc",
          line: "#e2e8f0",
        },
      },
    },
  },
  plugins: [],
};

export default config;
