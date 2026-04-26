"use client";

import dynamic from "next/dynamic";
import { PiggyBank, Loader2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";

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
      <PageHero
        icon={PiggyBank}
        tone="rose"
        badge="Assets"
        title="Aset, Hutang, dan Split Bill"
        subtitle="Kelola kekayaan dan kewajiban dalam satu workspace dengan ringkasan yang mudah dibaca."
      />
      <AssetDebtTracker />
      <SplitBill />
    </div>
  );
}
