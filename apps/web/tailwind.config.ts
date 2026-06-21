import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace"
        ],
        sans: [
          "Inter",
          "Geist",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "sans-serif"
        ]
      },
      boxShadow: {
        glow: "0 0 56px rgb(var(--accent-rgb) / 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
