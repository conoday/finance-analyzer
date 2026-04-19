"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/utils/supabase/client";
import type { QuickTransaction } from "@/components/SmartInput";

const LS_KEY = "fa_quick_transactions";

function loadLocal(): QuickTransaction[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); }
  catch { return []; }
}

/** Map a Supabase transactions row → QuickTransaction */
function rowToTx(row: Record<string, unknown>): QuickTransaction {
  return {
    id:       String(row.id),
    desc:     String(row.description ?? ""),
    amount:   Math.abs(Number(row.amount)),
    category: String(row.category_raw ?? "Lainnya"),
    emoji:    "📦",
    method:   String(row.method ?? "Cash"),
    date:     String(row.date ?? new Date().toISOString().slice(0, 10)),
    isIncome: row.type === "income",
    raw:      String(row.notes ?? row.description ?? ""),
  };
}

export function useTransactions() {
  const { user } = useAuth();
  const [txs, setTxs]       = useState<QuickTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [migrated, setMigrated] = useState(false);
  const supabase = createClient();

  /* ── Load from Supabase ── */
  const loadCloud = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("id,description,amount,type,category_raw,method,date,notes")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(300);
    if (!error && data) setTxs(data.map(rowToTx));
    setLoading(false);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Load from localStorage ── */
  const loadLocal_ = useCallback(() => setTxs(loadLocal()), []);

  /* ── Switch source when auth state changes ── */
  useEffect(() => {
    if (user) loadCloud();
    else      loadLocal_();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Auto-migrate localStorage → Supabase on first login ── */
  useEffect(() => {
    if (!user || migrated) return;
    const local = loadLocal();
    if (local.length === 0) { setMigrated(true); return; }

    const rows = local.map((tx) => {
      const d = new Date(tx.date);
      return {
        user_id:       user.id,
        date:          tx.date,
        description:   tx.desc,
        amount:        tx.isIncome ? tx.amount : -tx.amount,
        type:          tx.isIncome ? "income" : "expense",
        category_raw:  tx.category,
        method:        tx.method,
        notes:         tx.raw,
        source:        "manual",
        hour_of_day:   d.getHours(),
        day_of_week:   d.getDay() === 0 ? 6 : d.getDay() - 1,
      };
    });

    supabase
      .from("transactions")
      .insert(rows)
      .then(() => {
        localStorage.removeItem(LS_KEY);
        setMigrated(true);
        loadCloud();
      });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Save a new transaction ── */
  const save = useCallback(async (tx: QuickTransaction) => {
    if (user) {
      const d = new Date(tx.date);
      const { error } = await supabase.from("transactions").insert({
        user_id:      user.id,
        date:         tx.date,
        description:  tx.desc,
        amount:       tx.isIncome ? tx.amount : -tx.amount,
        type:         tx.isIncome ? "income" : "expense",
        category_raw: tx.category,
        method:       tx.method,
        notes:        tx.raw,
        source:       "manual",
        hour_of_day:  d.getHours(),
        day_of_week:  d.getDay() === 0 ? 6 : d.getDay() - 1,
      });
      if (!error) await loadCloud();
    } else {
      const existing = loadLocal();
      const updated  = [tx, ...existing].slice(0, 200);
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      setTxs(updated);
    }
  }, [user, loadCloud]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Delete one transaction ── */
  const deleteOne = useCallback(async (id: string) => {
    if (user) {
      // ID bisa integer atau UUID; kirim apa adanya, Supabase handle casting
      await supabase.from("transactions").delete()
        .eq("id", id)
        .eq("user_id", user.id);
      setTxs((prev) => prev.filter((t) => t.id !== id));
    } else {
      const updated = txs.filter((t) => t.id !== id);
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
      setTxs(updated);
    }
  }, [user, txs]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Clear all ── */
  const clear = useCallback(async () => {
    if (user) {
      await supabase.from("transactions")
        .delete()
        .eq("user_id", user.id)
        .eq("source", "manual");
      setTxs([]);
    } else {
      localStorage.removeItem(LS_KEY);
      setTxs([]);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    txs,
    loading,
    save,
    deleteOne,
    clear,
    refresh: user ? loadCloud : loadLocal_,
    isCloud: !!user,
  };
}
