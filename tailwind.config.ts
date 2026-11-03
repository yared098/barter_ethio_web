import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00A86B',
          dark: '#007A4D',
          light: '#E8F5EE',
          mid: '#B8E5CC',
        },
        ink: {
          DEFAULT: '#0B3D2E',
          muted: '#5A7A6B',
          subtle: '#9BB0A5',
        },
        border: '#D4E8DD',
        divider: '#EBF3EF',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;