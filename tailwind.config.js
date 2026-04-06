/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#f2f5f9',
          100: '#e1e9f1',
          200: '#c8d7e6',
          300: '#a3bdd5',
          400: '#789cc0',
          500: '#587faa',
          600: '#45668e',
          700: '#395374',
          800: '#314661',
          900: '#2c3d53',
          950: '#0a192f',
        },
        gold: {
          50: '#fffbea',
          100: '#fff1c5',
          200: '#ffe285',
          300: '#ffcb46',
          400: '#ffae1b',
          500: '#f98d07',
          600: '#dd6b02',
          700: '#b74c06',
          800: '#943b0a',
          900: '#7a310d',
          950: '#461803',
          DEFAULT: '#D4AF37',
        },
        dark: {
          950: '#080b14',
          900: '#0d1021',
          850: '#111427',
          800: '#161930',
          750: '#1a1f3a',
          700: '#1e2442',
          600: '#252c52',
          500: '#2e3762',
        },
        accent: {
          blue: '#4f8ef7',
          purple: '#8b5cf6',
          cyan: '#22d3ee',
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
          orange: '#f97316',
        }
      },
      animation: {
        'gauge-fill': 'gaugeFill 1.5s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        gaugeFill: {
          from: { 'stroke-dashoffset': '251.2' },
          to: { 'stroke-dashoffset': 'var(--target-offset)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
