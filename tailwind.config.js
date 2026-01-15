/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        survival: {
          health: '#ef4444',
          hunger: '#f59e0b',
          thirst: '#3b82f6',
          temp: '#10b981',
        }
      }
    },
  },
  plugins: [],
}
