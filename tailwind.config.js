/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{ts,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        'madoka': {
          'bg': '#fafafa',
          'bg-secondary': '#ffffff',
          'bg-tertiary': '#f5f5f5',
          'text': '#000000',
          'text-secondary': '#666666',
          'muted': '#999999',
          'border': '#e5e5e5',
          'border-light': '#f0f0f0',
        }
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'madoka-sm': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'madoka': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'madoka-lg': '0 8px 28px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
