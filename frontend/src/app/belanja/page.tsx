"use client";

import { FormEvent, useMemo, useState } from "react";
import { ExternalLink, Loader2, Search, ShoppingBag, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { MotionSection } from "@/components/MotionSection";
import { PageHero } from "@/components/PageHero";
import { ReportLinkButton } from "@/components/ReportLinkButton";
import { useAuth } from "@/hooks/useAuth";
import { useDisplayMode } from "@/hooks/useDisplayMode";
import { useTransactions } from "@/hooks/useTransactions";
import { formatRupiah } from "@/lib/utils";
import type { QuickTransaction } from "@/components/SmartInput";

type PlatformKey = "shopee" | "tiktokshop" | "alfagift";

type AffiliateProduct = {
  id: string;
  name: string;
  price: number | null;
  platform: string;
  affiliate_url: string;
  image_url?: string | null;
  description?: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const PLATFORM_OPTIONS: Array<{ key: PlatformKey; label: string }> = [
  { key: "shopee", label: "Shopee" },
  { key: "tiktokshop", label: "TikTok Shop" },
  { key: "alfagift", label: "Alfagift" },
];

const AI_QUERY_PRESETS = ["sunscreen", "beras 5kg", "headset gaming", "popok bayi", "kopi sachet"];

function platformLabel(platform: string): string {
  const hit = PLATFORM_OPTIONS.find((item) => item.key === platform);
  return hit?.label ?? platform;
}

export default function BelanjaPage() {
  const { user } = useAuth();
  const { save } = useTransactions();
  const { isShowtime, prefersReducedMotion, motionTier } = useDisplayMode();
  const { scrollYProgress } = useScroll();
  const floatingY = useTransform(scrollYProgress, [0, 1], [0, isShowtime ? -36 : -10]);

  const [platform, setPlatform] = useState<PlatformKey>("shopee");
  const [query, setQuery] = useState("");
  const [lastSearch, setLastSearch] = useState<string>("belum ada pencarian");
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [celebrateId, setCelebrateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "info"; text: string } | null>(null);

  const activePlatformLabel = useMemo(() => platformLabel(platform), [platform]);

  async function searchProducts(forcedQuery?: string) {
    const searchTerm = (forcedQuery ?? query).trim();
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const params = new URLSearchParams({
        platform,
        active_only: "true",
        fallback_any: "true",
        limit: "12",
      });

      if (searchTerm) {
        params.set("q", searchTerm);
      }

      const res = await fetch(`${API_BASE}/affiliate/products?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`API ${res.status}`);
      }

      const payload = (await res.json()) as { products?: AffiliateProduct[] };
      const items = payload.products ?? [];

      setProducts(items);
      setLastSearch(searchTerm || `semua produk ${activePlatformLabel}`);

      if (items.length === 0) {
        setStatus({
          type: "info",
          text: `Belum ada produk yang cocok di ${activePlatformLabel}. Coba kata kunci lain.`,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengambil rekomendasi produk.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBought(product: AffiliateProduct) {
    if (!product.price || product.price <= 0) {
      setStatus({
        type: "info",
        text: "Produk ini belum punya harga tetap, jadi belum bisa auto-catat. Catat manual di menu Transaksi.",
      });
      return;
    }

    const tx: QuickTransaction = {
      id: `web-shop-${Date.now()}`,
      desc: `Belanja ${product.name} (${platformLabel(product.platform)})`,
      amount: Number(product.price),
      category: "Belanja",
      emoji: "🛍",
      method: platformLabel(product.platform),
      date: new Date().toISOString().slice(0, 10),
      isIncome: false,
      raw: `Belanja AI Web | ${product.name} | ${product.affiliate_url}`,
    };

    await save(tx);
    setCelebrateId(product.id);
    setTimeout(() => {
      setCelebrateId((current) => (current === product.id ? null : current));
    }, 1100);
    setStatus({
      type: "success",
      text: `Transaksi belanja untuk "${product.name}" berhasil dicatat.`,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void searchProducts();
  }

  return (
    <div className="relative space-y-6">
      {isShowtime && !prefersReducedMotion ? (
        <motion.div
          style={{ y: floatingY }}
          className="motion-ambient pointer-events-none absolute -right-20 top-6 h-44 w-44 rounded-full bg-rose-200/35 blur-3xl"
        />
      ) : null}

      <MotionSection delay={0.02}>
        <PageHero
          icon={ShoppingBag}
          tone="rose"
          badge="AI Shopping"
          title="Belanja Hemat dengan AI"
          subtitle="Pilih platform, cari produk, lalu catat pembelian otomatis seperti alur di Telegram."
        />
      </MotionSection>

      <MotionSection delay={0.05}>
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {PLATFORM_OPTIONS.map((item) => (
              <button
                key={item.key}
                onClick={() => setPlatform(item.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  platform === item.key
                    ? "border border-teal-200 bg-teal-50 text-teal-700"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Contoh: sunscreen, headset gaming, beras 5kg"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Cari Rekomendasi
            </button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Saran cepat</span>
            {AI_QUERY_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setQuery(preset);
                  void searchProducts(preset);
                }}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-teal-200 hover:text-teal-700"
              >
                {preset}
              </button>
            ))}
          </div>

          {!user ? (
            <p className="mt-3 text-xs text-amber-700">
              Kamu belum login. Jika klik &quot;Sudah Beli&quot;, transaksi akan disimpan lokal di browser.
            </p>
          ) : null}
        </section>
      </MotionSection>

      {status ? (
        <MotionSection delay={0.07}>
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              status.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border border-sky-200 bg-sky-50 text-sky-700"
            }`}
          >
            {status.text}
          </div>
        </MotionSection>
      ) : null}

      {error ? (
        <MotionSection delay={0.08}>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Gagal memuat produk: {error}
          </div>
        </MotionSection>
      ) : null}

      <MotionSection delay={0.1}>
        <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-base font-bold text-slate-900">Rekomendasi Produk</p>
              <p className="text-xs text-slate-500">Pencarian terakhir: {lastSearch}</p>
            </div>
            {!loading && products.length > 0 ? (
              <p className="text-xs font-semibold text-slate-500">{products.length} produk</p>
            ) : null}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-teal-500" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-10 text-center">
              <ShoppingBag className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">Belum ada produk untuk ditampilkan</p>
              <p className="mt-1 text-xs text-slate-500">Pilih platform dan masukkan kata kunci untuk mulai cari.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product, idx) => (
                <motion.article
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: motionTier.context, delay: Math.min(idx * 0.04, 0.2) }}
                  whileHover={
                    isShowtime && !prefersReducedMotion
                      ? { y: -6, rotateX: 3.5, rotateY: -3.5, scale: 1.02 }
                      : { y: -2, scale: 1.01 }
                  }
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  style={{ transformStyle: "preserve-3d", transformPerspective: 900 }}
                >
                  <AnimatePresence>
                    {celebrateId === product.id ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.88 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        transition={{ duration: motionTier.micro, ease: "easeOut" }}
                        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-emerald-500/18 backdrop-blur-[1px]"
                      >
                        <span className="rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-xs font-bold text-emerald-700">
                          Tercatat ✓
                        </span>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                      {platformLabel(product.platform)}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {product.price ? formatRupiah(Number(product.price)) : "Harga belum tersedia"}
                    </span>
                  </div>

                  <p className="line-clamp-2 text-sm font-bold text-slate-900">{product.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {product.description || "Produk rekomendasi dari katalog affiliate aktif."}
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <a
                      href={product.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                    >
                      Buka Produk
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => void handleBought(product)}
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-500"
                    >
                      Sudah Beli
                    </button>
                  </div>

                  <div className="mt-3 border-t border-slate-100 pt-2.5">
                    <ReportLinkButton productId={product.id} productName={product.name} />
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </MotionSection>
    </div>
  );
}
