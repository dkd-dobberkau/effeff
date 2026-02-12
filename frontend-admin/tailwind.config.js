/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      colors: {
        accent: {
          DEFAULT: "#6c5ce7",
          hover: "#7f70f0",
        },
      },
    },
  },
  plugins: [],
};
