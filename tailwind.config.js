/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"], // This tells Tailwind to scan your HTML files
  theme: {
    extend: {
      backgroundImage: {
        'tech-hero': "radial-gradient(circle at 25% 50%, rgba(0,209,224,0.08) 0%, transparent 50%), radial-gradient(circle at center, #0b161d 0%, #020609 100%)",
      },
    },
  },
  plugins: [],
}