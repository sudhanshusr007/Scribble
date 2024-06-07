/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors:{
        primary:'#2B85FF',
        secondary:'#EF863E'
      }
    },
  },
  plugins: [],
}

