/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Colores institucionales Clínica Santa Bárbara
        clinica: {
          DEFAULT: '#0D2D6B',
          dark: '#0A2354',
          deep: '#081B40',
          base: '#0D2D6B',
          mid: '#16468E',
          light: '#1F5BB5',
          soft: '#E8EEF8',
          tint: '#F4F7FC',
        },
      },
      boxShadow: {
        card: '0 4px 16px rgba(13, 45, 107, 0.10), 0 1px 3px rgba(13, 45, 107, 0.08)',
        'card-hover': '0 10px 28px rgba(13, 45, 107, 0.18), 0 2px 6px rgba(13, 45, 107, 0.10)',
        metric: '0 6px 20px rgba(13, 45, 107, 0.14)',
        inset: 'inset 0 2px 4px rgba(13, 45, 107, 0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: { 'fade-in': 'fade-in 0.4s ease-out' },
    },
  },
  plugins: [],
}
