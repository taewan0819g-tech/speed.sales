import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Footer } from "@/components/Footer";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Speed.Sales – Global Seller Content Engine",
  description: "Generate platform-ready content for your products.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col antialiased bg-ivory text-charcoal">
        <div className="flex-1 flex flex-col min-h-0">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
