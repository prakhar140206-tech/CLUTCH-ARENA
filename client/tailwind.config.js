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
          bg: '#0a0d10',
          'bg-deep': '#06080a',
          surface: '#11171d',
          'surface-light': '#161e27',
          'surface-elevated': '#1c2632',
          border: 'rgba(34, 197, 94, 0.15)',
          'border-subtle': 'rgba(255, 255, 255, 0.08)',
          'border-focus': '#22c55e',
          neon: '#22c55e',
          lime: '#84cc16',
          'lime-glow': '#a3e635',
          cyan: '#06b6d4',
          'cyan-glow': '#22d3ee',
          gold: '#eab308',
          'gold-light': '#facc15',
          text: '#f8fafc',
          muted: '#94a3b8',
          subtle: '#64748b',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#ef4444'
        },
        cyber: {
          dark: '#0a0d10',
          green: '#22c55e',
          lime: '#84cc16',
          cyan: '#06b6d4',
          gold: '#eab308'
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
