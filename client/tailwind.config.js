/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clutch: {
          bg: '#060713',
          surface: '#0c0f24',
          'surface-light': '#121634',
          'surface-elevated': '#171c42',
          border: '#1e2552',
          'border-focus': '#7c3aed',
          violet: '#7c3aed',
          'violet-light': '#8b5cf6',
          lavender: '#c4b5fd',
          'lavender-muted': '#a78bfa',
          text: '#f8fafc',
          muted: '#94a3b8',
          subtle: '#64748b',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#ef4444',
          cyan: '#06b6d4'
        },
        cyber: {
          dark: '#060713',
          violet: '#7c3aed',
          cyan: '#06b6d4',
          lime: '#10b981',
          magenta: '#ec4899'
        }
      },
      fontFamily: {
        cyber: ['Orbitron', 'Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Outfit', 'Space Grotesk', 'sans-serif']
      }
    },
  },
  plugins: [],
}
