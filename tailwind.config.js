/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3D7C65', // Mint green (matches mobile)
          50: '#EBF4F0',
          100: '#D5EBE3',
          200: '#A8C9BA',
          300: '#7AA994',
          400: '#5A947A',
          500: '#3D7C65', // Main mint
          600: '#326654',
          700: '#285043',
          800: '#1E3C33',
          900: '#152820',
        },
        secondary: {
          DEFAULT: '#ffcd00', // Yellow
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#ffcd00', // Main yellow
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
      },
    },
  },
  plugins: [],
}
