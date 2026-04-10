import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OprexDuit — Masuk atau Daftar",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f0fdf9] flex items-center justify-center relative overflow-hidden px-4">
      {/* Background mesh */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-violet-500/8 blur-[100px]" />
      </div>
      {children}
    </div>
  );
}
