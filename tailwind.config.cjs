module.exports = {
  content: [
    // Include Angular templates and TS files so Tailwind scans component HTML
    './apps/web/src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4A6C6F',
        'primary-focus': '#3C575A',
        'primary-content': '#FFFFFF',
        secondary: '#EAB308',
        'secondary-focus': '#CA8A04',
        'secondary-content': '#1F2937',
        accent: '#A3BFB8',
        neutral: '#2c3e50',
        'base-100': '#FDFCFB',
        'base-200': '#F1F0EE',
        'base-300': '#E4E2DF',
        pro: '#EAB308',
        info: '#3B82F6',
        success: '#16A34A',
        warning: '#F97316',
        error: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        soft: '0 4px 12px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 10px 25px rgba(0, 0, 0, 0.06)',
        'soft-xl': '0 20px 40px rgba(0, 0, 0, 0.07)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
};
