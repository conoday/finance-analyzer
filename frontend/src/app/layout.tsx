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

import { FloatingAIChat } from "@/components/FloatingAIChat";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased bg-[#f8fafc] text-slate-800 min-h-screen`}>
        {children}
        <FloatingAIChat />
        <Toaster position="top-right" richColors theme="light" />
      </body>
    </html>
  );
}
