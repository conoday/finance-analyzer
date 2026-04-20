import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const TEAL = "#0f766e";

function MenuItem({ icon, label, sub, onPress, danger }: {
  icon: string; label: string; sub?: string; onPress: () => void; danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: danger ? "#fee2e2" : "rgba(20,184,166,0.1)" }]}>
        <Ionicons name={icon as any} size={20} color={danger ? "#dc2626" : TEAL} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && { color: "#dc2626" }]}>{label}</Text>
        {sub && <Text style={styles.menuSub}>{sub}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
    </TouchableOpacity>
  );
}

export default function ProfilScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const email = user?.email || "";
  const name = (user?.user_metadata?.full_name as string) || email.split("@")[0] || "Pengguna";
  const avatar = name.charAt(0).toUpperCase();

  const handleSignOut = () => {
    Alert.alert("Keluar", "Yakin ingin logout?", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profil</Text>

        {/* User card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatar}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userEmail}>{email}</Text>
          </View>
        </View>

        {/* Telegram Integration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Integrasi</Text>
          <View style={styles.telegramCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={styles.tgIcon}>
                <Text style={{ fontSize: 20 }}>✈️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a" }}>Telegram Bot</Text>
                <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  Catat transaksi & foto struk via Telegram
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.tgBtn}
              onPress={() => Linking.openURL("https://t.me/OprexDuitBot")}
            >
              <Text style={styles.tgBtnText}>Buka Bot →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplikasi</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="notifications-outline"
              label="Pengingat"
              sub="Atur notifikasi harian"
              onPress={() => Alert.alert("Segera hadir", "Fitur notifikasi akan datang.")}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="shield-checkmark-outline"
              label="Keamanan & Privasi"
              sub="Data kamu aman di Supabase"
              onPress={() => Alert.alert("Privasi", "Semua data tersimpan aman di Supabase.")}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="information-circle-outline"
              label="Tentang OprexDuit"
              sub="v1.0.0"
              onPress={() => Alert.alert("OprexDuit", "Oprex Duit v1.0.0\nNgatur duit, beres.")}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="heart-outline"
              label="Donasi & Support"
              sub="Dukung pengembangan OprexDuit"
              onPress={() => Alert.alert("Terima kasih ❤️", "Support kami sangat berarti!")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.menuCard}>
            <MenuItem icon="log-out-outline" label="Keluar" onPress={handleSignOut} danger />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  userCard: { flexDirection: "row", alignItems: "center", gap: 16, marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "#e2e8f0" },
  avatar: { width: 56, height: 56, borderRadius: 18, backgroundColor: TEAL, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 24, fontWeight: "800", color: "#fff" },
  userName: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  userEmail: { fontSize: 13, color: "#64748b", marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  telegramCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  tgIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#e0f2fe", alignItems: "center", justifyContent: "center" },
  tgBtn: { backgroundColor: "#0284c7", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  tgBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  menuCard: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  menuSub: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#f8fafc", marginHorizontal: 16 },
});
