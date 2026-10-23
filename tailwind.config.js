/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: '#7A9A7B',
          light: '#A3BDA4',
          dark: '#4F6A50',
          surface: '#E4EDE4'
        },
        sand: {
          DEFAULT: '#EFE8D8',
          light: '#F8F5EE',
          dark: '#DDD2BA'
        },
        slate: {
          DEFAULT: '#4A6B82',
          light: '#7695AB',
          dark: '#2F4858',
          surface: '#E2EBF0'
        },
        charcoal: {
          DEFAULT: '#2C3539',
          muted: '#4A555A'
        },
        terracotta: {
          DEFAULT: '#D97757',
          light: '#EBA088',
          dark: '#A85134',
          surface: '#F9E7E1'
        }
      },
      fontFamily: {
        sans: ['"Nunito"', '"Segoe UI"', 'Roboto', 'system-ui', 'sans-serif'],
      },
      minWidth: {
        'touch': '64px',
      },
      minHeight: {
        'touch': '64px',
      }
    },
  },
  plugins: [],
}
