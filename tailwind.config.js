/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./**/*.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        urdu: ['"Noto Nastaliq Urdu"', "serif"],
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "typing-dot": {
          "0%, 80%, 100%": { opacity: "0.35", transform: "scale(0.85)" },
          "40%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.35s ease-out forwards",
        "typing-dot": "typing-dot 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
