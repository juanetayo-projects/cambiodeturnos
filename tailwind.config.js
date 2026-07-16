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
        // Gris neutro para el lienzo neumórfico (fondo de módulos y vistas)
        neu: {
          bg: '#E6EAF0',
          surface: '#DDE3EC',
          light: '#FFFFFF',
          dark: '#A9B4C6',
        },
      },
      boxShadow: {
        card: '0 4px 16px rgba(13, 45, 107, 0.10), 0 1px 3px rgba(13, 45, 107, 0.08)',
        'card-hover': '0 10px 28px rgba(13, 45, 107, 0.18), 0 2px 6px rgba(13, 45, 107, 0.10)',
        metric: '0 6px 20px rgba(13, 45, 107, 0.14)',
        inset: 'inset 0 2px 4px rgba(13, 45, 107, 0.06)',
        // Sombras neumórficas (par claro/oscuro sobre el gris neu.bg)
        neu: '9px 9px 18px rgba(163, 177, 198, 0.55), -9px -9px 18px rgba(255, 255, 255, 0.9)',
        'neu-lg': '14px 14px 28px rgba(163, 177, 198, 0.55), -14px -14px 28px rgba(255, 255, 255, 0.9)',
        'neu-sm': '5px 5px 10px rgba(163, 177, 198, 0.5), -5px -5px 10px rgba(255, 255, 255, 0.85)',
        'neu-flat': '3px 3px 6px rgba(163, 177, 198, 0.4), -3px -3px 6px rgba(255, 255, 255, 0.7)',
        'neu-inset': 'inset 4px 4px 8px rgba(163, 177, 198, 0.5), inset -4px -4px 8px rgba(255, 255, 255, 0.85)',
        'neu-inset-sm': 'inset 2px 2px 5px rgba(163, 177, 198, 0.5), inset -2px -2px 5px rgba(255, 255, 255, 0.85)',
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
