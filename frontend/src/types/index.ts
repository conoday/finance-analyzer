/* ─────────────────────────────────────────────
   src/types/index.ts  -- Pipeline data contracts
   ───────────────────────────────────────────── */

export interface Summary {
  total_income: number;
  total_expense: number;
  net_cashflow: number;
  tx_count: number;
  income_count: number;
  expense_count: number;
  avg_expense: number;
  avg_income: number;
  date_range: string;
}

export interface CategoryRow {
  kategori: string;
  total: number;
  pct: number;
}

export interface MonthlyRow {
  periode: string;
  income: number;
  expense: number;
  net: number;
}

export interface MerchantRow {
  deskripsi: string;
  jumlah_transaksi: number;
  total_debit: number;
}

export interface IncomeSrcRow {
  deskripsi: string;
  jumlah_transaksi: number;
  total_kredit: number;
}

export interface TimeseriesRow {
  tanggal: string;
  net_harian: number;
  kumulatif: number;
}

export interface ForecastRow {
  tanggal: string;
  predicted_net: number;
  predicted_kumulatif: number;
  lower: number;
  upper: number;
}

export interface SubscriptionRow {
  merchant: string;
  kategori: string;
  amount_tipikal: number;
  frekuensi: string;
  interval_hari: number;
  estimated_monthly: number;
  confidence: number;
  is_known_sub: boolean;
}

export interface HealthDimension {
  name: string;
  score: number;
  weight: number;
  label: string;
  description: string;
  icon: string;
}

export interface HealthReport {
  overall: number;
  grade: string;
  headline: string;
  dimensions: HealthDimension[];

  // ---------------------------------------------------------------------------
  // Shared Budget Room Types
  // ---------------------------------------------------------------------------
}

// Plan tier keys
export type PlanType =
  | "personal" | "couple" | "family" | "group"
  | "team" | "business" | "corporate" | "enterprise";

export const PLAN_META: Record<PlanType, { label: string; maxMembers: number; price: number; desc: string; color: string }> = {
  personal:  { label: "Personal",   maxMembers: 1,   price: 0,      desc: "Untuk 1 orang",               color: "#64748b" },
  couple:    { label: "Couple",     maxMembers: 2,   price: 29000,  desc: "Berdua — pasangan / sahabat",   color: "#ec4899" },
  family:    { label: "Family",     maxMembers: 4,   price: 49000,  desc: "Hingga 4 anggota keluarga",     color: "#f59e0b" },
  group:     { label: "Group",      maxMembers: 8,   price: 79000,  desc: "Komunitas kecil — 8 orang",     color: "#22c55e" },
  team:      { label: "Team",       maxMembers: 16,  price: 149000, desc: "Tim startup — 16 orang",        color: "#6366f1" },
  business:  { label: "Business",   maxMembers: 50,  price: 299000, desc: "Hingga 50 anggota",             color: "#3b82f6" },
  corporate: { label: "Corporate",  maxMembers: 200, price: 799000, desc: "Hingga 200 anggota",            color: "#8b5cf6" },
  enterprise:{ label: "Enterprise", maxMembers: -1,  price: -1,     desc: "Tak terbatas — hubungi kami",   color: "#14b8a6" },
};

export interface RoomMember {
  member_id: string;
  display_name: string;
  color: string;
  budgets: Record<string, number>;      // personal budget limits
  summary: Record<string, number> | null;
  by_category: CategoryRow[];
  joined_at: string;
}

export interface SharedRoom {
  room_id: string;
  invite_code: string;
  plan_type: PlanType;
  max_members: number;
  created_at: string;
  member_count: number;
  shared_budgets: Record<string, number>;
  members: RoomMember[];
  plan_info: { label: string; price_idr: number; desc: string };
}

export interface MonthlyStory {
  periode: string;
  income: number;
  expense: number;
  net: number;
  top_category: string;
  top_amount: number;
  headline: string;
  body: string;
  mood: string;
}

export interface OverallStory {
  headline: string;
  paragraphs: string[];
  highlights: string[];
}

export interface TransactionRow {
  tanggal: string;
  deskripsi: string;
  debit: number;
  kredit: number;
  kategori: string;
  tipe: string;
}

export interface AnalysisResult {
  summary: Summary;
  by_category: CategoryRow[];
  monthly: MonthlyRow[];
  top_merchants: MerchantRow[];
  income_src: IncomeSrcRow[];
  timeseries: TimeseriesRow[];
  forecast: ForecastRow[];
  subscriptions: SubscriptionRow[];
  sub_total_monthly: number;
  health_report: HealthReport | null;
  monthly_stories: MonthlyStory[];
  overall_story: OverallStory;
  category_baseline: Record<string, number>;
  transactions: TransactionRow[];
  errors: string[];
}

export interface SimulateRequest {
  adjustments: Record<string, number>;
  horizon_months: number;
  summary: Summary;
  monthly: MonthlyRow[];
  by_category: CategoryRow[];
}

export interface ProjectionRow {
  bulan: string;
  projected_income: number;
  projected_expense: number;
  projected_net: number;
  projected_cumulative: number;
}

export interface ImpactResult {
  monthly_saving: number;
  total_saving: number;
  pct_reduction: number;
}

export interface SimulateResult {
  projection: ProjectionRow[];
  impact: ImpactResult;
  baseline: Record<string, number>;
}
