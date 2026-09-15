import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#150B29',
        surface: '#1F1240',
        'surface-2': '#2A1856',
        border: '#35225E',
        gold: '#C9A24D',
        'gold-soft': '#E4C77A',
        ink: '#F6F3FB',
        muted: '#A497C4',
        danger: '#E5636B',
        success: '#6FCF97',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
