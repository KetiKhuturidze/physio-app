/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF3F9',
          100: '#DCE6F0',
          200: '#B9CEE1',
          300: '#93B0CE',
          400: '#6E94BE',
          500: '#4F79A8',
          600: '#3F6690',
          700: '#2F4E72',
          800: '#223A56',
          900: '#16283D',
        },
        accent: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
      },
    },
  },
  plugins: [],
};
