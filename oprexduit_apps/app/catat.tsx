import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/hooks/useTransactions";
import { Ionicons } from "@expo/vector-icons";

const CATEGORIES = [
  { label: "Makan", emoji: "🍔" }, { label: "Transport", emoji: "🚗" },
  { label: "Belanja", emoji: "🛒" }, { label: "Tagihan", emoji: "📱" },
  { label: "Hiburan", emoji: "🎮" }, { label: "Kesehatan", emoji: "💊" },
  { label: "Pendapatan", emoji: "💰" }, { label: "Lainnya", emoji: "⚡" },
];

export default function CatatModal() {
  const { user } = useAuth();
  const { add } = useTransactions(user?.id);
  const router = useRouter();
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState("Lainnya");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!desc.trim()) { Alert.alert("Error", "Deskripsi wajib diisi"); return; }
    const numAmt = parseFloat(amount.replace(/[^\d.]/g, ""));
    if (!numAmt || numAmt <= 0) { Alert.alert("Error", "Jumlah harus lebih dari 0"); return; }

    setLoading(true);
    const error = await add({ description: desc.trim(), amount: numAmt, type, category_raw: category });
    setLoading(false);

    if (error) {
      Alert.alert("Gagal", error.message);
    } else {
      router.back();
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.title}>Catat Transaksi</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Simpan</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
          {/* Type Toggle */}
          <View style={styles.typeRow}>
            {(["expense", "income"] as const).map((t) => (
              <TouchableOpacity key={t} onPress={() => setType(t)}
                style={[styles.typeChip, type === t && (t === "expense" ? styles.typeExpense : styles.typeIncome)]}>
                <Text style={[styles.typeText, type === t && { color: "#fff" }]}>
                  {t === "expense" ? "💸 Pengeluaran" : "💰 Pemasukan"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <View>
            <Text style={styles.label}>Jumlah</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>Rp</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Description */}
          <View>
            <Text style={styles.label}>Keterangan</Text>
            <TextInput
              style={styles.input}
              placeholder="cth: Makan siang nasi padang"
              value={desc}
              onChangeText={setDesc}
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Category */}
          <View>
            <Text style={styles.label}>Kategori</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat.label} onPress={() => setCategory(cat.label)}
                  style={[styles.catChip, category === cat.label && styles.catChipActive]}>
                  <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                  <Text style={[styles.catLabel, category === cat.label && { color: "#0f766e", fontWeight: "700" }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick amount buttons */}
          <View>
            <Text style={styles.label}>Nominal Cepat</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {[5000, 10000, 15000, 20000, 25000, 50000, 100000, 200000].map((amt) => (
                <TouchableOpacity key={amt} onPress={() => setAmount(String(amt))}
                  style={styles.quickBtn}>
                  <Text style={styles.quickBtnText}>
                    {amt >= 1000 ? `${amt / 1000}rb` : amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  title: { fontSize: 17, fontWeight: "700", color: "#0f172a" },
  saveBtn: { backgroundColor: "#0f766e", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  typeRow: { flexDirection: "row", gap: 10 },
  typeChip: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: "center", backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0" },
  typeExpense: { backgroundColor: "#dc2626", borderColor: "#dc2626" },
  typeIncome: { backgroundColor: "#059669", borderColor: "#059669" },
  typeText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  label: { fontSize: 13, fontWeight: "600", color: "#64748b", marginBottom: 8 },
  amountRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 16, paddingVertical: 4 },
  currency: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: "800", color: "#0f172a", paddingVertical: 10 },
  input: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#0f172a" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: { width: "22%", minWidth: 76, alignItems: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", gap: 4 },
  catChipActive: { borderColor: "#0f766e", backgroundColor: "rgba(20,184,166,0.07)" },
  catLabel: { fontSize: 10, color: "#64748b", textAlign: "center" },
  quickBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f1f5f9", borderWidth: 1, borderColor: "#e2e8f0" },
  quickBtnText: { fontSize: 13, fontWeight: "600", color: "#475569" },
});
