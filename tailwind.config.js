/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          900: 'rgb(var(--s-900) / <alpha-value>)',
          800: 'rgb(var(--s-800) / <alpha-value>)',
          700: 'rgb(var(--s-700) / <alpha-value>)',
          600: 'rgb(var(--s-600) / <alpha-value>)',
          500: 'rgb(var(--s-500) / <alpha-value>)',
          400: 'rgb(var(--s-400) / <alpha-value>)',
          300: 'rgb(var(--s-300) / <alpha-value>)',
        },
        accent: {
          blue: '#3b82f6',
          green: '#22c55e',
          red: '#ef4444',
          yellow: '#f59e0b',
          purple: '#a855f7',
        },
      },
    },
  },
  plugins: [],
}
