/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F6F9",
        royalBlue: "#0B3BF4",
        amberOrange: "#F59E0B",
      },
      boxShadow: {
        'nb': '0 3px 0 0 #000000',
        'nb-lg': '0 4px 0 0 #000000',
        'nb-sm': '0 2px 0 0 #000000',
      }
    },
  },
  plugins: [],
}
