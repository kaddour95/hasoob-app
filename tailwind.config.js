/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#080d1a',
          900: '#0d1525',
          800: '#121e36',
          700: '#1a2a4a',
          600: '#1e3260',
        },
        gold: {
          300: '#f0d080',
          400: '#e8c04a',
          500: '#d4a017',
          600: '#b8880a',
        },
      },
      fontFamily: {
        arabic: ['Cairo', 'IBM Plex Sans Arabic', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
