

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#004AAD',
        secondary: '#FBC02D',
        accent: '#00C896',
        danger: '#FF5252',
        success: '#4CAF50',
        background: '#F8FAFC',
        foreground: '#1F2937',
        // For CSS variable-based theming
        brand: {
          primary: 'var(--color-primary)',
          secondary: 'var(--color-secondary)',
          accent: 'var(--color-accent)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        sm: '8px',
        md: '16px',
        lg: '32px',
      },
      fontSize: {
        h1: '2.25rem', // 36px
        h2: '1.5rem', // 24px
        body: '1rem',  // 16px
        label: '0.875rem', // 14px
      },
      screens: {
        mobile: '480px',
        tablet: '768px',
        desktop: '1024px',
      },
      height: {
        'fill-available': '-webkit-fill-available',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function({ addComponents, theme }) {
      addComponents({
        '.btn': {
          padding: `${theme('spacing.md')} ${theme('spacing.lg')}`,
          borderRadius: theme('borderRadius.md'),
          fontWeight: theme('fontWeight.medium'),
        },
        '.btn-primary': {
          backgroundColor: theme('colors.primary'),
          color: theme('colors.white'),
          '&:hover': {
            backgroundColor: theme('colors.primary', '700'),
          },
        },
        '.btn-secondary': {
          backgroundColor: theme('colors.secondary'),
          color: theme('colors.black'),
          '&:hover': {
            backgroundColor: theme('colors.secondary', '600'),
          },
        },
      });
    }
  ],
}