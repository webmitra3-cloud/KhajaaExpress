/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c"
        },
        ink: "#1f2937",
        warm: "#fef3c7"
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Manrope", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 20px 45px rgba(249, 115, 22, 0.18)",
        card: "0 16px 30px rgba(15, 23, 42, 0.08)"
      },
      backgroundImage: {
        hero: "radial-gradient(circle at top, rgba(253, 186, 116, 0.5), transparent 60%)",
        swirl: "radial-gradient(circle at 10% 20%, rgba(255, 237, 213, 0.7), transparent 50%), radial-gradient(circle at 80% 10%, rgba(254, 215, 170, 0.6), transparent 45%), linear-gradient(120deg, #fff7ed 0%, #fffbeb 60%, #fff 100%)"
      }
    }
  },
  plugins: []
};
