import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { FloatingAIChat } from "@/components/FloatingAIChat";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "OprexDuit — Ngatur Duit, Beres.",
  description: "Aplikasi keuangan pribadi cerdas. Catat transaksi, analisis pengeluaran, dan kelola keuangan dengan mudah.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#f4f8fb] font-sans text-slate-800 antialiased">
        <AppShell>
          {children}
        </AppShell>
        <FloatingAIChat />
        <Toaster position="top-right" richColors theme="light" />
      </body>
    </html>
  );
}
