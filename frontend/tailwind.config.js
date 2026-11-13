/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bbdffc',
          300: '#7cc2fa',
          400: '#38a1f6',
          500: '#0c85e4',
          600: '#0267bc',
          700: '#035298',
          800: '#07467d',
          900: '#0c3b69',
          950: '#082545',
        }
      }
    },
  },
  plugins: [],
}
