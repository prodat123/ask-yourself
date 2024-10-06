/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode

  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Update this path to match your project structure
    './public/index.html', // Include if you're using a public HTML file
  ],
  theme: {
    extend: {
      colors: {
        primary: '#004aad',
        background: '#f2f5f9',
        accent: '#6998d4',
      },
      fontFamily: {
        lato: ['Lato', 'sans-serif'], // Add Lato to your Tailwind theme
      },
    },
  },
  plugins: [],
};

