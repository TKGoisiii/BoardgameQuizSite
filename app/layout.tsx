import type { Metadata } from "next";
import { DotGothic16 } from "next/font/google";
import "./globals.css";
import Footer from "@/components/layout/footer";
const dotGothic16 = DotGothic16({
  weight: '400',
  subsets: ['latin'],
  display: 'swap'
});


export const metadata: Metadata = {
  title: 'Boardgame Quiz',
  description: 'Test your boardgame knowledge!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={dotGothic16.className}>
      <body className="h-dvh relative">
        <main className="flex flex-col min-h-dvh pb-4">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
