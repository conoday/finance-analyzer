"use client";

/**
 * SplitBill.tsx
 * Split tagihan/struk: input item → tambah peserta → assign item ke orang → hitung pajak → ringkasan.
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt, Users, Calculator, Plus, Trash2, X,
  Check, ChevronRight, ChevronLeft, Upload, Loader2,
  Copy, RotateCcw, Camera,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────

interface BillItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  assignedTo: Set<string>; // participant ids
}

interface Participant {
  id: string;
  name: string;
}

type Step = 1 | 2 | 3 | 4;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://oprexduit.onrender.com";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Main Component ────────────────────────────────────────────────────────

export function SplitBill() {
  const [step, setStep] = useState<Step>(1);
  const [eventName, setEventName] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [taxPct, setTaxPct] = useState(10);
  const [servicePct, setServicePct] = useState(5);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newParticipant, setNewParticipant] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Step 1: Items ────────────────────────────────────────────────────────

  function addItem() {
    const price = parseFloat(newItemPrice.replace(/[^\d.]/g, ""));
    const qty = parseInt(newItemQty) || 1;
    if (!newItemName.trim() || isNaN(price) || price <= 0) return;
    setItems(prev => [...prev, {
      id: uid(),
      name: newItemName.trim(),
      price,
      qty,
      assignedTo: new Set(),
    }]);
    setNewItemName("");
    setNewItemPrice("");
    setNewItemQty("1");
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/split-bill/parse`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Gagal parse struk");
      const json = await res.json();
      const parsed: BillItem[] = (json.items as any[]).map(it => ({
        id: uid(),
        name: it.name,
        price: it.price,
        qty: it.qty ?? 1,
        assignedTo: new Set<string>(),
      }));
      setItems(prev => [...prev, ...parsed]);
      if (json.event_name) setEventName(json.event_name);
      if (json.tax_pct != null) setTaxPct(json.tax_pct);
    } catch {
      alert("Gagal membaca struk. Silakan input item secara manual.");
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // ── Step 2: Participants ─────────────────────────────────────────────────

  function addParticipant() {
    if (!newParticipant.trim()) return;
    setParticipants(prev => [...prev, { id: uid(), name: newParticipant.trim() }]);
    setNewParticipant("");
  }

  function removeParticipant(id: string) {
    setParticipants(prev => prev.filter(p => p.id !== id));
    // Remove from all item assignments
    setItems(prev => prev.map(item => {
      const next = new Set(item.assignedTo);
      next.delete(id);
      return { ...item, assignedTo: next };
    }));
  }

  // ── Step 3: Assignment ────────────────────────────────────────────────────

  function toggleAssign(itemId: string, participantId: string) {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const next = new Set(item.assignedTo);
      if (next.has(participantId)) next.delete(participantId);
      else next.add(participantId);
      return { ...item, assignedTo: next };
    }));
  }

  function assignAll(itemId: string) {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const allAssigned = participants.every(p => item.assignedTo.has(p.id));
      const next = allAssigned ? new Set<string>() : new Set(participants.map(p => p.id));
      return { ...item, assignedTo: next };
    }));
  }

  // ── Step 4: Summary ───────────────────────────────────────────────────────

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const taxAmount = subtotal * (taxPct / 100);
  const serviceAmount = subtotal * (servicePct / 100);
  const grandTotal = subtotal + taxAmount + serviceAmount;

  type Summary = Record<string, { name: string; items: string[]; subtotal: number; tax: number; service: number; total: number }>;

  function computeSummary(): Summary {
    const result: Summary = {};
    participants.forEach(p => {
      result[p.id] = { name: p.name, items: [], subtotal: 0, tax: 0, service: 0, total: 0 };
    });

    items.forEach(item => {
      const assigned = [...item.assignedTo];
      if (assigned.length === 0) return;
      const share = (item.price * item.qty) / assigned.length;
      assigned.forEach(pid => {
        if (!result[pid]) return;
        result[pid].items.push(`${item.name} (${formatRupiah(share, true)})`);
        result[pid].subtotal += share;
      });
    });

    // Tax & service: split equally among all participants who have items
    const active = Object.values(result).filter(r => r.subtotal > 0).length || participants.length;
    const taxShare = taxAmount / active;
    const serviceShare = serviceAmount / active;

    Object.values(result).forEach(r => {
      if (r.subtotal > 0) {
        r.tax = taxShare;
        r.service = serviceShare;
        r.total = r.subtotal + taxShare + serviceShare;
      }
    });

    return result;
  }

  function buildShareText(summary: Summary): string {
    const lines: string[] = [
      `🧾 *${eventName || "Split Bill"}*`,
      "",
    ];
    Object.values(summary).filter(r => r.total > 0).forEach(r => {
      lines.push(`👤 *${r.name}*`);
      r.items.forEach(i => lines.push(`  • ${i}`));
      if (taxPct > 0) lines.push(`  + Pajak ${taxPct}%: ${formatRupiah(r.tax, true)}`);
      if (servicePct > 0) lines.push(`  + Service ${servicePct}%: ${formatRupiah(r.service, true)}`);
      lines.push(`  ➜ *Total: ${formatRupiah(r.total, true)}*`);
      lines.push("");
    });
    lines.push(`💰 Grand total: ${formatRupiah(grandTotal, true)}`);
    return lines.join("\n");
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  function reset() {
    setStep(1);
    setEventName("");
    setItems([]);
    setParticipants([]);
    setTaxPct(10);
    setServicePct(5);
    setNewItemName("");
    setNewItemPrice("");
    setNewItemQty("1");
    setNewParticipant("");
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const STEPS = [
    { num: 1, label: "Item" },
    { num: 2, label: "Peserta" },
    { num: 3, label: "Assign" },
    { num: 4, label: "Bayar" },
  ];

  const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40";

  const summary = step === 4 ? computeSummary() : {} as Summary;
  const shareText = step === 4 ? buildShareText(summary) : "";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-600" />
            Split Bill
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Upload struk atau input manual, lalu bagi rata tagihan</p>
        </div>
        {(items.length > 0 || participants.length > 0) && (
          <button onClick={reset} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-800 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, idx) => (
          <div key={s.num} className="flex items-center gap-2">
            <button
              onClick={() => step > s.num && setStep(s.num as Step)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                step === s.num
                  ? "text-white"
                  : step > s.num
                  ? "text-teal-700 hover:bg-teal-50 cursor-pointer"
                  : "text-slate-400 cursor-default"
              }`}
              style={step === s.num ? { background: "#0f766e" } : step > s.num ? { background: "rgba(20,184,166,0.12)" } : {}}
            >
              {step > s.num ? <Check className="w-3 h-3" /> : <span>{s.num}</span>}
              {s.label}
            </button>
            {idx < STEPS.length - 1 && (
              <ChevronRight className="w-4 h-4 text-slate-700" />
            )}
          </div>
        ))}
      </div>

      {/* Event name */}
      <input
        value={eventName}
        onChange={e => setEventName(e.target.value)}
        placeholder="Nama acara / restoran (opsional)"
        className={inputClass}
      />

      <AnimatePresence mode="wait">

        {/* ── Step 1: Items ── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            className="space-y-4">
            {/* Upload photo */}
            <div className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: "rgba(20,184,166,0.05)", border: "1px dashed rgba(20,184,166,0.35)" }}>
              <Camera className="w-6 h-6 text-teal-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">Upload Foto Struk</p>
                <p className="text-xs text-slate-400">AI akan membaca item & harga secara otomatis</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-teal-700 border border-teal-300 hover:bg-teal-50 transition-colors disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {isUploading ? "Memproses..." : "Pilih Foto"}
              </button>
            </div>

            {/* Manual item input */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Tambah Item Manual</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input className={inputClass} value={newItemName} onChange={e => setNewItemName(e.target.value)}
                  placeholder="Nama item" onKeyDown={e => e.key === "Enter" && addItem()} />
                <input className={inputClass} value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)}
                  type="number" min="0" placeholder="Harga (Rp)" onKeyDown={e => e.key === "Enter" && addItem()} />
                <div className="flex gap-2">
                  <input className={inputClass} value={newItemQty} onChange={e => setNewItemQty(e.target.value)}
                    type="number" min="1" placeholder="Qty" style={{ maxWidth: "80px" }} />
                  <button onClick={addItem}
                    disabled={!newItemName.trim() || !newItemPrice}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 flex-1"
                    style={{ background: "#0f766e" }}>
                    <Plus className="w-3.5 h-3.5" /> Tambah
                  </button>
                </div>
              </div>
            </div>

            {/* Item list */}
            {items.length > 0 && (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">
                        {item.qty > 1 ? `${item.qty}x ` : ""}{formatRupiah(item.price, true)}
                        {item.qty > 1 ? ` = ${formatRupiah(item.price * item.qty, true)}` : ""}
                      </p>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ))}

                {/* Subtotal */}
                <div className="flex justify-between px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(20,184,166,0.07)", color: "#0f766e" }}>
                  <span>Subtotal ({items.length} item)</span>
                  <span className="font-mono">{formatRupiah(subtotal, true)}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={items.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
              style={{ background: items.length > 0 ? "#0f766e" : "#94a3b8" }}>
              Lanjut: Tambah Peserta <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ── Step 2: Participants ── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            className="space-y-4">
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Peserta
              </p>
              <div className="flex gap-2">
                <input className={inputClass} value={newParticipant} onChange={e => setNewParticipant(e.target.value)}
                  placeholder="Nama peserta" onKeyDown={e => e.key === "Enter" && addParticipant()} />
                <button onClick={addParticipant} disabled={!newParticipant.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 whitespace-nowrap"
                  style={{ background: "#0f766e" }}>
                  <Plus className="w-3.5 h-3.5" /> Tambah
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {participants.map(p => (
                  <span key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{ background: "rgba(20,184,166,0.10)", color: "#0f766e" }}>
                    {p.name}
                    <button onClick={() => removeParticipant(p.id)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-800 border border-slate-200 hover:bg-slate-50 flex-1">
                <ChevronLeft className="w-4 h-4" /> Kembali
              </button>
              <button onClick={() => setStep(3)} disabled={participants.length === 0}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 flex-[2]"
                style={{ background: participants.length > 0 ? "#0f766e" : "#94a3b8" }}>
                Lanjut: Assign Item <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Assign ── */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            className="space-y-4">
            <p className="text-xs text-slate-700">Pilih siapa yang memesan setiap item (bisa lebih dari 1 orang).</p>

            <div className="space-y-3">
              {items.map(item => {
                const allAssigned = participants.every(p => item.assignedTo.has(p.id));
                return (
                  <div key={item.id} className="rounded-2xl p-4 space-y-3"
                    style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                        <p className="text-xs text-slate-400 font-mono">
                          {item.qty > 1 ? `${item.qty}x ` : ""}{formatRupiah(item.price, true)}
                          {item.qty > 1 ? ` = ${formatRupiah(item.price * item.qty, true)}` : ""}
                          {item.assignedTo.size > 0 && ` ÷ ${item.assignedTo.size} = ${formatRupiah((item.price * item.qty) / item.assignedTo.size, true)}/org`}
                        </p>
                      </div>
                      <button onClick={() => assignAll(item.id)}
                        className="text-[10px] font-semibold text-teal-600 border border-teal-300 px-2 py-0.5 rounded-full hover:bg-teal-50 transition-colors">
                        {allAssigned ? "Hapus Semua" : "Semua"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {participants.map(p => {
                        const sel = item.assignedTo.has(p.id);
                        return (
                          <button key={p.id} onClick={() => toggleAssign(item.id, p.id)}
                            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                            style={sel
                              ? { background: "#0f766e", color: "#fff" }
                              : { background: "#f1f5f9", color: "#64748b" }}>
                            {sel && <Check className="w-3 h-3 inline mr-1" />}{p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tax & Service */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Pajak & Biaya Layanan</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Pajak (%)</label>
                  <input type="number" min="0" max="30" step="1" value={taxPct}
                    onChange={e => setTaxPct(Number(e.target.value))}
                    className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Service Charge (%)</label>
                  <input type="number" min="0" max="30" step="1" value={servicePct}
                    onChange={e => setServicePct(Number(e.target.value))}
                    className={inputClass} />
                </div>
              </div>
              <div className="text-xs text-slate-700 space-y-1 pt-1">
                <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{formatRupiah(subtotal, true)}</span></div>
                {taxPct > 0 && <div className="flex justify-between"><span>Pajak {taxPct}%</span><span className="font-mono">{formatRupiah(taxAmount, true)}</span></div>}
                {servicePct > 0 && <div className="flex justify-between"><span>Service {servicePct}%</span><span className="font-mono">{formatRupiah(serviceAmount, true)}</span></div>}
                <div className="flex justify-between text-sm font-bold text-slate-700 pt-1 border-t border-slate-100">
                  <span>Grand Total</span><span className="font-mono">{formatRupiah(grandTotal, true)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-800 border border-slate-200 hover:bg-slate-50 flex-1">
                <ChevronLeft className="w-4 h-4" /> Kembali
              </button>
              <button onClick={() => setStep(4)}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white flex-[2]"
                style={{ background: "#0f766e" }}>
                Lihat Ringkasan <Calculator className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Summary ── */}
        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            className="space-y-4">
            <div className="text-center py-2">
              <p className="text-base font-bold text-slate-800">{eventName || "Split Bill"}</p>
              <p className="text-sm text-slate-400">Grand Total: <span className="font-mono font-bold text-teal-700">{formatRupiah(grandTotal, true)}</span></p>
            </div>

            <div className="space-y-3">
              {Object.values(summary).filter(r => r.total > 0).map(r => (
                <motion.div key={r.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4 space-y-2" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-800">👤 {r.name}</p>
                    <p className="text-base font-bold font-mono text-teal-700">{formatRupiah(r.total, true)}</p>
                  </div>
                  <div className="space-y-0.5">
                    {r.items.map((it, i) => (
                      <p key={i} className="text-xs text-slate-700">• {it}</p>
                    ))}
                    {taxPct > 0 && r.tax > 0 && (
                      <p className="text-xs text-slate-400">+ Pajak {taxPct}%: {formatRupiah(r.tax, true)}</p>
                    )}
                    {servicePct > 0 && r.service > 0 && (
                      <p className="text-xs text-slate-400">+ Service {servicePct}%: {formatRupiah(r.service, true)}</p>
                    )}
                  </div>
                </motion.div>
              ))}
              {Object.values(summary).some(r => r.total === 0) && (
                <p className="text-xs text-slate-400 text-center">
                  * {Object.values(summary).filter(r => r.total === 0).map(r => r.name).join(", ")} tidak mendapatkan item
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(3)}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-800 border border-slate-200 hover:bg-slate-50 flex-1">
                <ChevronLeft className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => copyText(shareText)}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white flex-[2] transition-all"
                style={{ background: copied ? "#16a34a" : "#0f766e" }}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Tersalin!" : "Salin & Bagikan"}
              </button>
            </div>

            <button onClick={reset}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors">
              <RotateCcw className="w-4 h-4" /> Split baru
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
