/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ff2a5f", 
        secondary: "#0f172a", // Slate 900
        glass: "rgba(255, 255, 255, 0.05)",
        glassborder: "rgba(255, 255, 255, 0.1)",
      },
      animation: {
        'radar-ping': 'radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'radar-ping': {
          '75%, 100%': {
            transform: 'scale(1.5)',
            opacity: '0',
          }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
