/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyberBg: '#070d1a',
        cyberCard: '#0d1526',
        cyberNeon: '#00ff9d',
      }
    },
  },
  plugins: [],
}