import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";

const formatRupiah = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}jt`;
  if (Math.abs(n) >= 1_000) return `Rp${Math.round(n / 1_000)}rb`;
  return `Rp${n}`;
};

function getMonthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      value: d.toISOString().slice(0, 7),
      label: d.toLocaleString("id-ID", { month: "long", year: "numeric" }),
    });
  }
  return opts;
}

const CATEGORY_COLORS: Record<string, string> = {
  Makan: "#fb923c", Transport: "#38bdf8", Belanja: "#c084fc",
  Tagihan: "#2dd4bf", Hiburan: "#f472b6", Kesehatan: "#4ade80",
  Pendapatan: "#34d399", Lainnya: "#94a3b8",
};

export default function LaporanScreen() {
  const { user } = useAuth();
  const { transactions, loading, fetch } = useTransactions(user?.id);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [refreshing, setRefreshing] = useState(false);
  const months = getMonthOptions();

  useEffect(() => { fetch(month); }, [user, month]);

  const onRefresh = async () => { setRefreshing(true); await fetch(month); setRefreshing(false); };

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  const byCategory: Record<string, number> = {};
  transactions.filter((t) => t.type === "expense").forEach((t) => {
    const cat = t.category_raw || "Lainnya";
    byCategory[cat] = (byCategory[cat] || 0) + t.amount;
  });
  const catSorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0f766e" />}
      >
        <Text style={styles.title}>Laporan</Text>

        {/* Month Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 16 }}>
          {months.map((m) => (
            <TouchableOpacity key={m.value} onPress={() => setMonth(m.value)}
              style={[styles.chip, month === m.value && styles.chipActive]}>
              <Text style={[styles.chipText, month === m.value && styles.chipTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Net Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pemasukan</Text>
              <Text style={[styles.summaryAmt, { color: "#34d399" }]}>{formatRupiah(totalIncome)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pengeluaran</Text>
              <Text style={[styles.summaryAmt, { color: "#f87171" }]}>{formatRupiah(totalExpense)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Net</Text>
              <Text style={[styles.summaryAmt, { color: net >= 0 ? "#34d399" : "#f87171" }]}>
                {net >= 0 ? "+" : ""}{formatRupiah(net)}
              </Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pengeluaran Per Kategori</Text>
          {loading ? (
            <ActivityIndicator color="#0f766e" />
          ) : catSorted.length === 0 ? (
            <Text style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", paddingVertical: 24 }}>
              Tidak ada data untuk bulan ini
            </Text>
          ) : (
            catSorted.map(([cat, amt]) => {
              const pct = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
              const color = CATEGORY_COLORS[cat] || "#94a3b8";
              return (
                <View key={cat} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ fontSize: 13, color: "#334155", fontWeight: "600" }}>{cat}</Text>
                    <Text style={{ fontSize: 13, color: "#0f172a", fontWeight: "700" }}>
                      {formatRupiah(amt)} <Text style={{ fontWeight: "400", color: "#64748b" }}>({pct.toFixed(0)}%)</Text>
                    </Text>
                  </View>
                  <View style={{ height: 8, backgroundColor: "#f1f5f9", borderRadius: 9 }}>
                    <View style={{ width: `${Math.min(pct, 100)}%` as any, height: 8, backgroundColor: color, borderRadius: 9 }} />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Monthly comparison (simple numbers) */}
        <View style={[styles.section, { marginBottom: 80 }]}>
          <Text style={styles.sectionTitle}>Statistik Bulan Ini</Text>
          <View style={{ gap: 12 }}>
            {[
              { label: "Total Transaksi", value: `${transactions.length} tx` },
              { label: "Rata-rata per transaksi", value: formatRupiah(transactions.length > 0 ? totalExpense / Math.max(1, transactions.filter(t => t.type === "expense").length) : 0) },
              { label: "Hari dengan transaksi", value: `${new Set(transactions.map(t => t.date?.slice(0, 10))).size} hari` },
            ].map((item) => (
              <View key={item.label} style={styles.statRow}>
                <Text style={styles.statLabel}>{item.label}</Text>
                <Text style={styles.statValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0" },
  chipActive: { backgroundColor: "#0f766e", borderColor: "#0f766e" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  chipTextActive: { color: "#fff" },
  summaryCard: { backgroundColor: "#0f766e", marginHorizontal: 16, borderRadius: 20, padding: 20, marginBottom: 20 },
  summaryRow: { flexDirection: "row" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLabel: { fontSize: 11, color: "rgba(255,255,255,0.65)" },
  summaryAmt: { fontSize: 15, fontWeight: "700", marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a", marginBottom: 14 },
  statRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  statLabel: { fontSize: 13, color: "#64748b" },
  statValue: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
});
