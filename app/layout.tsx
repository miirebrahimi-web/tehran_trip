import "./globals.css";
import Script from "next/script";
import { Vazirmatn } from "next/font/google";

const font = Vazirmatn({ subsets: ["arabic", "latin"], display: "swap" });

export const metadata = { title: "سفر تهران" };
export const viewport = { width: "device-width", initialScale: 1, maximumScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={font.className}>{children}</body>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
    </html>
  );
}
