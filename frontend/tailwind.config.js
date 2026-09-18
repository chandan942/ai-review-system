/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable dark mode via class
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark mode surface layering from web-design skill
        'surface': '#090A0F',
        'card': '#12151D',
        'elevated': '#1B202D',
        'accent': '#3B82F6', // Blue accent for CTAs
        'critical': '#EF4444',
        'high': '#F59E0B',
        'medium': '#EAB308',
        'low': '#3B82F6',
        'info': '#06B6D4',
      },
      spacing: {
        // 8px spatial grid
        'xs': '0.5rem', // 8px
        'sm': '1rem',   // 16px
        'md': '1.5rem', // 24px
        'lg': '2rem',   // 32px
        'xl': '2.5rem', // 40px
      },
      borderRadius: {
        'sm': '0.125rem', // 2px
        'DEFAULT': '0.25rem', // 4px
        'md': '0.375rem', // 6px
        'lg': '0.5rem',   // 8px
      },
      transitionDuration: {
        '150': '150ms',
      },
      transitionTimingFunction: {
        'DEFAULT': 'cubic-bezier(0.4, 0, 0.2, 1)', // ease-out
      },
    },
  },
  plugins: [],
}