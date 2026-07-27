/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: '#16181d',
        panelalt: '#1d2027',
        edge: '#2a2f39',
      },
    },
  },
  plugins: [],
};