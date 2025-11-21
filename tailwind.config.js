/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './js/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        worksans: ['"Work Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
