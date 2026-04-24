/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        foreground: "var(--text)",
        primary: {
          DEFAULT: "var(--accent)",
          foreground: "#fff",
        },
        secondary: {
          DEFAULT: "var(--bg2)",
          foreground: "var(--text2)",
        },
        muted: {
          DEFAULT: "var(--bg3)",
          foreground: "var(--text3)",
        },
        border: "var(--border)",
      },
    },
  },
  plugins: [],
}
