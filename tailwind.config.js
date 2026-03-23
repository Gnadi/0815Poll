/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef0fd',
          100: '#dce0fb',
          200: '#b9c1f7',
          300: '#9699f4',
          400: '#7a7cf1',
          500: '#5d5fef',
          600: '#4b4dcc',
          700: '#393ba9',
          800: '#2a2c86',
          900: '#1c1d63',
        },
        'app-bg': '#f6f6f8',
        'dark-bg': '#111121',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
