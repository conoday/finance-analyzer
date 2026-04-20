import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { Ionicons } from "@expo/vector-icons";
import { getCategoryColor, getCategoryEmoji } from "@/components/CategoryBadge";

const formatRupiah = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}jt`;
  if (Math.abs(n) >= 1_000) return `Rp${Math.round(n / 1_000)}rb`;
  return `Rp${n}`;
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function DashboardScreen() {
  const { user } = useAuth();
  const { transactions, loading, fetch } = useTransactions(user?.id);
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetch(currentMonth());
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetch(currentMonth());
    setRefreshing(false);
  };

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  const monthLabel = new Date().toLocaleString("id-ID", { month: "long", year: "numeric" });

  if (loading && transactions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#0f766e" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0f766e" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hei 👋</Text>
            <Text style={styles.subGreeting}>{monthLabel}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/catat" as any)}>
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Net Worth Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Arus Kas Bersih</Text>
          <Text style={[styles.heroAmount, { color: net >= 0 ? "#34d399" : "#f87171" }]}>
            {net >= 0 ? "+" : ""}{formatRupiah(net)}
          </Text>
          <Text style={styles.heroSub}>{monthLabel}</Text>
          <View style={styles.heroRow}>
            <View style={styles.heroItem}>
              <Text style={styles.heroItemLabel}>📈 Pemasukan</Text>
              <Text style={[styles.heroItemValue, { color: "#34d399" }]}>{formatRupiah(totalIncome)}</Text>
            </View>
            <View style={[styles.heroItem, { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.15)" }]}>
              <Text style={styles.heroItemLabel}>📉 Pengeluaran</Text>
              <Text style={[styles.heroItemValue, { color: "#f87171" }]}>{formatRupiah(totalExpense)}</Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        {transactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kategori Pengeluaran</Text>
            <CategoryBreakdown transactions={transactions} total={totalExpense} />
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/transaksi" as any)}>
              <Text style={styles.seeAll}>Lihat semua →</Text>
            </TouchableOpacity>
          </View>
          {transactions.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
              <Text style={styles.emptyDesc}>Catat sekarang dengan tombol + di atas</Text>
            </View>
          ) : (
            transactions.slice(0, 5).map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryBreakdown({ transactions, total }: { transactions: any[]; total: number }) {
  const byCategory: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const cat = t.category_raw || "Lainnya";
      byCategory[cat] = (byCategory[cat] || 0) + t.amount;
    });

  const sorted = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <View style={{ gap: 10 }}>
      {sorted.map(([cat, amt]) => {
        const pct = total > 0 ? (amt / total) * 100 : 0;
        const color = getCategoryColor(cat);
        return (
          <View key={cat}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 12, color: "#475569" }}>{getCategoryEmoji(cat)} {cat}</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#0f172a" }}>{formatRupiah(amt)}</Text>
            </View>
            <View style={{ height: 6, backgroundColor: "#f1f5f9", borderRadius: 9 }}>
              <View style={{ width: `${Math.min(pct, 100)}%` as any, height: 6, backgroundColor: color, borderRadius: 9 }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function TransactionRow({ tx }: { tx: any }) {
  const isIncome = tx.type === "income";
  const emoji = getCategoryEmoji(tx.category_raw || "Lainnya");
  const color = getCategoryColor(tx.category_raw || "Lainnya");
  const dateStr = tx.date?.slice(0, 10) || "";

  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: `${color}20` }]}>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
        <Text style={styles.txDate}>{dateStr} · {tx.category_raw || "Lainnya"}</Text>
      </View>
      <Text style={[styles.txAmt, { color: isIncome ? "#059669" : "#dc2626" }]}>
        {isIncome ? "+" : "-"}{formatRupiah(tx.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  greeting: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  subGreeting: { fontSize: 13, color: "#64748b", marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#0f766e", alignItems: "center", justifyContent: "center" },
  heroCard: { backgroundColor: "#0f766e", marginHorizontal: 16, borderRadius: 24, padding: 24, marginBottom: 24 },
  heroLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.5 },
  heroAmount: { fontSize: 36, fontWeight: "800", marginTop: 6 },
  heroSub: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2, marginBottom: 16 },
  heroRow: { flexDirection: "row" },
  heroItem: { flex: 1, paddingHorizontal: 12 },
  heroItemLabel: { fontSize: 11, color: "rgba(255,255,255,0.65)" },
  heroItemValue: { fontSize: 16, fontWeight: "700", marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a", marginBottom: 12 },
  seeAll: { fontSize: 12, color: "#0f766e", fontWeight: "600" },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  txDesc: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  txDate: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: "700", fontVariant: ["tabular-nums"] },
  emptyBox: { alignItems: "center", paddingVertical: 32, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "dashed" },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: "#475569" },
  emptyDesc: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
});
