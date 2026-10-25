/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#080811',
          violet: '#8B5CF6',
          cyan: '#06B6D4',
          lime: '#84CC16',
          magenta: '#EC4899'
        }
      },
      fontFamily: {
        cyber: ['Orbitron', 'Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Outfit', 'sans-serif']
      }
    },
  },
  plugins: [],
}
