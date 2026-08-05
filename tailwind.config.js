/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand scales (marketing, decor, legacy utilities)
        cream: {
          DEFAULT: '#F7F4EC',
          50: '#FBF9F4',
          100: '#F7F4EC',
          200: '#F3EEE3',
          300: '#E8E2D6',
          400: '#D4CBBA',
          paper: '#FEFCF6',
        },
        mint: {
          DEFAULT: '#E0ECDE',
          soft: '#E0ECDE',
        },
        peach: {
          DEFAULT: '#F7E9DA',
          soft: '#F7E9DA',
        },
        // Keep full primary/secondary scales for brand tints (primary-700, etc.)
        // Semantic shadcn tokens use CSS variables under the same names with DEFAULT/foreground.
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
          50: '#EBF4F0',
          100: '#D5EBE3',
          200: '#A8C9BA',
          300: '#7AA994',
          400: '#5A947A',
          500: '#3D7C65',
          600: '#326654',
          700: '#285043',
          800: '#1E3C33',
          900: '#152820',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
          50: '#FBF0D9',
          100: '#F7E9DA',
          200: '#F0D4A8',
          300: '#E8C07D',
          400: '#E8A838',
          500: '#E8A838',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // shadcn semantic tokens
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Quicksand', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        brand: ['Questrial', 'Quicksand', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        soft: '1rem',
        card: '1.125rem',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(26, 26, 26, 0.05)',
        card: '0 2px 12px rgba(26, 26, 26, 0.06)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
