/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "selector",
  theme: {
    extend: {
      fontFamily: {
        "cormorant-garamond": ['"Cormorant Garamond"', "serif"],
        "bona-nova-sc": ['"Bona Nova SC"', "serif"],
      },
      backgroundColor: {
        csb: "#C6C740",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-from-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-from-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        shake: {
          "0%, 35%": { transform: "translateX(0)" },
          "5%": { transform: "translateX(-2px)" },
          "10%": { transform: "translateX(2px)" },
          "15%": { transform: "translateX(-2px)" },
          "20%": { transform: "translateX(2px)" },
          "25%": { transform: "translateX(-2px)" },
          "30%": { transform: "translateX(2px)" },
          "32%": { transform: "translateX(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-in",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-from-right": "slide-from-right 0.3s ease-out",
        "slide-from-left": "slide-from-left 0.3s ease-out",
        shake: "shake 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
  safelist: [
    "w-[30px]",
    "w-[300px]",
    "w-[150px]",
    "w-[calc(100%-300px)]",
    "w-[calc(100%-30px)]",
    "lg:gap-[25px]",
    "h-[120px]",
    "lg:h-[140px]",
  ],
};
