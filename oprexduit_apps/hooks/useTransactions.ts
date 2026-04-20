import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category_raw?: string;
  scope?: string;
  source?: string;
}

export function useTransactions(userId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (monthFilter?: string) => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("transactions")
        .select("id,date,description,amount,type,category_raw,scope,source")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(100);

      if (monthFilter) {
        query = query
          .gte("date", `${monthFilter}-01`)
          .lte("date", `${monthFilter}-31T23:59:59`);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setTransactions(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const add = useCallback(async (tx: {
    description: string;
    amount: number;
    type: "income" | "expense";
    category_raw?: string;
    date?: string;
  }) => {
    if (!userId) return;
    const d = new Date(tx.date || new Date().toISOString());
    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      date: tx.date || new Date().toISOString().slice(0, 10),
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category_raw: tx.category_raw || "Lainnya",
      scope: "private",
      source: "mobile",
      hour_of_day: d.getHours(),
      day_of_week: d.getDay() === 0 ? 6 : d.getDay() - 1,
    });
    return error;
  }, [userId]);

  const remove = useCallback(async (id: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (!error) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
    return error;
  }, [userId]);

  return { transactions, loading, error, fetch, add, remove };
}
