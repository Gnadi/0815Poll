/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef0fb',
          100: '#dde1f7',
          200: '#bbc3ef',
          300: '#99a5e7',
          400: '#7787df',
          500: '#5B67CA',
          600: '#4a56b8',
          700: '#3a4397',
          800: '#2c3276',
          900: '#1e2255',
        },
        'app-bg': '#F0F0F5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
