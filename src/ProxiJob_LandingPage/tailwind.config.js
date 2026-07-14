/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF6B00',
          violet: '#6200EE',
          indigo: '#2E008B',
          bg: '#f7fafc',
          tile: '#F8FBFD',
          border: '#E5E9EB',
          text: '#181c1e',
          'text-variant': '#5a4136',
        },
        surface: {
          DEFAULT: '#f7fafc',
          dim: '#d7dadc',
          bright: '#f7fafc',
          lowest: '#ffffff',
          low: '#f1f4f6',
          container: '#ebeef0',
          high: '#e5e9eb',
          highest: '#e0e3e5',
        },
        primary: {
          DEFAULT: '#FF6B00',
          container: '#ff6b00',
          dark: '#a04100',
        },
        secondary: {
          DEFAULT: '#5b00df',
          container: '#7531ff',
        },
        tertiary: {
          DEFAULT: '#624abf',
          container: '#9e87ff',
        },
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        hanken: ['"Hanken Grotesk"', 'sans-serif'],
      },
      borderRadius: {
        'xs': '0.25rem',
        'sm': '0.5rem',      // 8px
        'md': '1.5rem',     // 24px
        'lg': '2rem',       // 32px
        'xl': '3rem',       // 48px
      },
      boxShadow: {
        'organic': '0 30px 60px -15px rgba(24, 28, 30, 0.05)',
        'glow': '0 0 15px rgba(255, 107, 0, 0.3)',
        'glow-violet': '0 0 15px rgba(91, 0, 223, 0.2)',
      },
      spacing: {
        'bento-gap': '24px',
        'container-padding': '32px',
        'section-margin': '64px',
      }
    },
  },
  plugins: [],
}
