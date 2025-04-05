/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}", // pages ディレクトリも念のため含める
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // プロジェクトルートに components がある場合
    "./app/components/**/*.{js,ts,jsx,tsx,mdx}", // app/components を明示的に指定
  ],
  theme: {
    extend: {}, // カスタムテーマをリセット
  },
  plugins: [],
};

export default config;
