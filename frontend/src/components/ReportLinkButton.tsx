"use client";

/**
 * ReportLinkButton.tsx
 * Tombol kecil untuk melaporkan link affiliate yang rusak/tidak valid.
 * Dipanggil bersama product_id dari affiliate_products.
 */

import { useState } from "react";
import { Flag, X, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Props {
  productId: string;
  productName?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://oprexduit.onrender.com";

export function ReportLinkButton({ productId, productName }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMsg("Silakan login terlebih dahulu untuk melaporkan link.");
        setStatus("error");
        return;
      }

      const res = await fetch(`${API_URL}/affiliate/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ product_id: productId, reason: reason.trim() || null }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`${res.status}: ${body}`);
      }

      setStatus("success");
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
        setReason("");
      }, 1800);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Laporkan link rusak"
        className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-rose-400 transition-colors"
      >
        <Flag className="w-3 h-3" />
        <span>Laporkan link</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-slate-100">Laporkan Link Rusak</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {productName && (
              <p className="text-xs text-slate-400">
                Produk: <span className="text-slate-200 font-medium">{productName}</span>
              </p>
            )}

            {status === "success" ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-teal-400" />
                <p className="text-sm font-semibold text-slate-100">Laporan terkirim!</p>
                <p className="text-xs text-slate-400">Tim kami akan segera menindaklanjuti.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Alasan (opsional)
                  </label>
                  <textarea
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 resize-none h-20"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="cth: Link tidak bisa dibuka, dialihkan ke halaman lain, dll."
                    maxLength={300}
                    disabled={status === "loading"}
                  />
                </div>

                {status === "error" && (
                  <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-900/30 border border-rose-700 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-slate-600 hover:bg-slate-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={status === "loading"}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {status === "loading" ? "Mengirim…" : "Kirim"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
