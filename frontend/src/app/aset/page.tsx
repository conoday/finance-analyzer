"use client";

import dynamic from "next/dynamic";
import { PiggyBank, Loader2 } from "lucide-react";

// Both components use localStorage — must be loaded client-side only
const AssetDebtTracker = dynamic(
  () => import("@/components/AssetDebtTracker").then((m) => m.AssetDebtTracker),
  { ssr: false, loading: () => <Loader2 className="w-6 h-6 animate-spin text-teal-500 mx-auto mt-8" /> }
);

const SplitBill = dynamic(
  () => import("@/components/SplitBill").then((m) => m.SplitBill),
  { ssr: false, loading: () => null }
);

export default function AsetPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(220,38,38,0.10)" }}>
          <PiggyBank className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Aset & Hutang</h1>
          <p className="text-xs text-slate-500">Catat aset, hutang, tagihan, dan split bill bareng teman</p>
        </div>
      </div>
      <AssetDebtTracker />
      <SplitBill />
    </div>
  );
}
