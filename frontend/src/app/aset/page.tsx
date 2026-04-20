"use client";

import { AssetDebtTracker } from "@/components/AssetDebtTracker";
import { SplitBill } from "@/components/SplitBill";
import { PiggyBank } from "lucide-react";

export default function AsetPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(220,38,38,0.10)" }}>
          <PiggyBank className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Aset & Hutang</h1>
          <p className="text-xs text-slate-500">Catat aset, hutang, dan split bill bareng teman</p>
        </div>
      </div>
      <AssetDebtTracker />
      <SplitBill />
    </div>
  );
}
