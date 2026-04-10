/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg:      "#0d0f14",
        surface: "#13161e",
        border:  "#1e2230",
        muted:   "#2a2f3d",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["DM Mono", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
