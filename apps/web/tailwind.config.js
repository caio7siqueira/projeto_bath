const defaultTheme = require('tailwindcss/defaultTheme');

/*****************************************
 * Tailwind CSS Config for apps/web
 *****************************************/
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
        display: ['var(--font-display)', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6ff',
          200: '#b8ccff',
          300: '#8aa9ff',
          400: '#5a7fff',
          500: '#3663ff',
          600: '#1f4be6',
          700: '#1635af',
          800: '#132c8a',
          900: '#122669',
        },
        accent: {
          amber: '#fbbf24',
          emerald: '#34d399',
          rose: '#fb7185',
        },
        surface: {
          base: '#ffffff',
          muted: '#f6f7fb',
          elevated: '#fdfdff',
          divider: '#e4e7ec',
        },
      },
      boxShadow: {
        soft: '0px 12px 40px rgba(15, 23, 42, 0.08)',
        focus: '0 0 0 3px rgba(54, 99, 255, 0.4)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
    },
  },
  plugins: [],
};
