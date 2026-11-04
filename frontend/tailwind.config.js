/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#174c3b",
        "forest-dark": "#103b2d",
        gold: "#bd8736",
        cream: "#fff9f0",
        paper: "#fffdf9",
        ink: "#302219",
        muted: "#87766a",
        line: "#ecdfcd",
      },
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui"],
        display: ["Playfair Display", "Georgia", "serif"],
      },
      boxShadow: { soft: "0 18px 50px rgba(61,42,23,.08)" },
    },
  },
  plugins: [],
};