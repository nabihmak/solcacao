/** @type {import('tailwindcss').Config} */
// Tailwind configuration with the SolCacao "high-end chocolate" theme.
// Use these colours in classes, e.g. bg-cocoa-900, text-gold-500, bg-cream.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cocoa: {
          50: '#FBF7F3',
          100: '#F3EAE0',
          200: '#E4D2BF',
          300: '#CDAE8F',
          400: '#A97F5B',
          500: '#8A5E3B',
          600: '#6F4A2E',
          700: '#573923',
          800: '#3E2819',
          900: '#2A1B11',
          950: '#1A100A',
        },
        gold: {
          300: '#E6CE95',
          400: '#D8B76A',
          500: '#C59B45',
          600: '#A87F2E',
          700: '#7A5A17', // gold for TEXT on light backgrounds (5.7:1 contrast, WCAG AA)
        },
        cream: '#F8F1E7',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
