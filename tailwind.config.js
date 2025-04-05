/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      height: {
        'screen': [
          '100vh','100dvh'
        ]
      },
      minHeight: {
        'screen': [
          '100vh','100dvh'
        ]
      },
      maxHeight: {
        'screen': [
          '100vh','100dvh'
        ]
      }
    },
  },
  plugins: [],
};

export default config;
