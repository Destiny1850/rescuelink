/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F3ECE0',      // fondo cálido (papel de ficha)
        'paper-dark': '#E8DFCE',
        ink: '#221F1A',         // texto principal
        forest: {
          DEFAULT: '#2F4538',  // color primario — confianza, refugio
          light: '#3E5A49',
          dark: '#1E2E25',
        },
        rescue: '#C1652F',      // terracota — SOLO para el sello "urgente"
        gold: '#C99A3D',        // acentos secundarios
        mist: '#7C8B85',        // texto secundario / bordes
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 0 rgba(34, 31, 26, 0.06), 0 8px 24px -8px rgba(34, 31, 26, 0.18)',
      },
      rotate: {
        '-8': '-8deg',
        '6': '6deg',
      },
      keyframes: {
        stamp: {
          '0%': { transform: 'scale(2.2) rotate(-12deg)', opacity: '0' },
          '60%': { transform: 'scale(0.95) rotate(-8deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-8deg)', opacity: '1' },
        },
      },
      animation: {
        stamp: 'stamp 260ms cubic-bezier(0.2, 0.8, 0.3, 1.1) forwards',
      },
    },
  },
  plugins: [],
};
