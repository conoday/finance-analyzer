import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "OprexDuit — Ngatur Duit, Beres.",
  description: "Aplikasi keuangan pribadi cerdas. Catat transaksi, analisis pengeluaran, dan kelola keuangan dengan mudah.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#08090e] text-slate-100 min-h-screen`}>
        {children}
        <Toaster position="top-right" richColors theme="dark" />
      </body>
    </html>
  );
}
