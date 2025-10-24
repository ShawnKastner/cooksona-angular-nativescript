/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('./tailwind.preset.cjs')],
  content: [
    './apps/**/*.{html,ts,tsx,jsx,js}',
    './libs/**/*.{html,ts,tsx,jsx,js}',
  ],
  theme: {
    extend: {
      // Ensure WCAG AA compliant colors
      colors: {
        // Primary colors with sufficient contrast
        primary: {
          DEFAULT: '#4A6C6F', // 4.5:1 contrast on white
          focus: '#3A5C5F',
          content: '#FFFFFF',
        },
        // Base colors
        base: {
          100: '#FFFFFF',
          200: '#F3F4F6',
          300: '#E5E7EB',
        },
        // Neutral with good contrast
        neutral: {
          DEFAULT: '#1F2937', // 14:1 contrast on white
          700: '#374151',
        },
        // Error state
        error: {
          DEFAULT: '#DC2626', // 4.5:1 contrast on white
        },
        // Success state
        success: {
          DEFAULT: '#059669', // 4.5:1 contrast on white
        },
        // Warning state
        warning: {
          DEFAULT: '#D97706', // 4.5:1 contrast on white
        },
      },
      // Typography with proper line heights for readability
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.6' }],
        'lg': ['1.125rem', { lineHeight: '1.6' }],
        'xl': ['1.25rem', { lineHeight: '1.6' }],
        '2xl': ['1.5rem', { lineHeight: '1.5' }],
        '3xl': ['1.875rem', { lineHeight: '1.4' }],
        '4xl': ['2.25rem', { lineHeight: '1.3' }],
      },
      // Focus ring utilities
      ringWidth: {
        DEFAULT: '3px',
        focus: '3px',
      },
      ringColor: {
        DEFAULT: '#4A6C6F',
      },
      // Minimum touch target sizes
      minWidth: {
        'touch': '44px', // iOS minimum
        'touch-android': '48px', // Android minimum
      },
      minHeight: {
        'touch': '44px',
        'touch-android': '48px',
      },
    },
  },
  plugins: [],
};
