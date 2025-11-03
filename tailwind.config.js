/*** /** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      height: {
        "fill-available": "-webkit-fill-available",
      },
    },
  },
  plugins: [],
};