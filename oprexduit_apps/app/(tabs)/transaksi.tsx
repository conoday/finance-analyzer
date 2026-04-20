import { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, RefreshControl, ActivityIndicator, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { Ionicons } from "@expo/vector-icons";
import { getCategoryColor, getCategoryEmoji } from "@/components/CategoryBadge";

const formatRupiah = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}jt`;
  if (Math.abs(n) >= 1_000) return `Rp${Math.round(n / 1_000)}rb`;
  return `Rp${n}`;
};

function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      value: d.toISOString().slice(0, 7),
      label: d.toLocaleString("id-ID", { month: "short", year: "2-digit" }),
    });
  }
  return options;
}

export default function TransaksiScreen() {
  const { user } = useAuth();
  const { transactions, loading, fetch, remove } = useTransactions(user?.id);
  const router = useRouter();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [refreshing, setRefreshing] = useState(false);
  const months = getMonthOptions();

  useEffect(() => { fetch(month); }, [user, month]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetch(month);
    setRefreshing(false);
  };

  const handleDelete = (tx: Transaction) => {
    Alert.alert(
      "Hapus Transaksi",
      `"${tx.description}" - ${formatRupiah(tx.amount)}\n\nYakin ingin menghapus?`,
      [
        { text: "Batal", style: "cancel" },
        { text: "Hapus", style: "destructive", onPress: () => remove(tx.id) },
      ]
    );
  };

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transaksi</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/catat" as any)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Month Filter */}
      <View style={styles.monthRow}>
        {months.map((m) => (
          <TouchableOpacity
            key={m.value}
            onPress={() => setMonth(m.value)}
            style={[styles.monthChip, month === m.value && styles.monthChipActive]}
          >
            <Text style={[styles.monthChipText, month === m.value && styles.monthChipTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary strip */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>📈 Masuk</Text>
          <Text style={[styles.summaryAmt, { color: "#059669" }]}>{formatRupiah(totalIncome)}</Text>
        </View>
        <View style={[styles.summaryItem, { borderLeftWidth: 1, borderLeftColor: "#e2e8f0" }]}>
          <Text style={styles.summaryLabel}>📉 Keluar</Text>
          <Text style={[styles.summaryAmt, { color: "#dc2626" }]}>{formatRupiah(totalExpense)}</Text>
        </View>
        <View style={[styles.summaryItem, { borderLeftWidth: 1, borderLeftColor: "#e2e8f0" }]}>
          <Text style={styles.summaryLabel}>💼 Transaksi</Text>
          <Text style={styles.summaryAmt}>{transactions.length}</Text>
        </View>
      </View>

      {/* List */}
      {loading && transactions.length === 0 ? (
        <ActivityIndicator color="#0f766e" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0f766e" />}
          contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 80 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>🧐</Text>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#475569" }}>Tidak ada transaksi</Text>
              <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Coba pilih bulan lain atau catat baru</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isIncome = item.type === "income";
            const color = getCategoryColor(item.category_raw || "Lainnya");
            return (
              <View style={styles.txCard}>
                <View style={[styles.txIcon, { backgroundColor: `${color}20` }]}>
                  <Text style={{ fontSize: 18 }}>{getCategoryEmoji(item.category_raw || "Lainnya")}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
                  <Text style={styles.txMeta}>{item.date?.slice(0, 10)} · {item.category_raw || "Lainnya"}</Text>
                </View>
                <Text style={[styles.txAmt, { color: isIncome ? "#059669" : "#dc2626" }]}>
                  {isIncome ? "+" : "-"}{formatRupiah(item.amount)}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color="#dc2626" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#0f766e", alignItems: "center", justifyContent: "center" },
  monthRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 12, flexWrap: "wrap" },
  monthChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0" },
  monthChipActive: { backgroundColor: "#0f766e", borderColor: "#0f766e" },
  monthChipText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  monthChipTextActive: { color: "#ffffff" },
  summaryRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 8, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  summaryItem: { flex: 1, paddingVertical: 12, alignItems: "center" },
  summaryLabel: { fontSize: 10, color: "#64748b" },
  summaryAmt: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginTop: 2 },
  txCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f1f5f9" },
  txIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  txDesc: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  txMeta: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: "700" },
  deleteBtn: { padding: 6, borderRadius: 8 },
  empty: { alignItems: "center", paddingVertical: 48, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "dashed" },
});
