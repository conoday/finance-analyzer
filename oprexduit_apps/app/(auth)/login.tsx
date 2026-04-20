import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert("Lengkapi data", "Email dan password wajib diisi.");
      return;
    }
    setLoading(true);
    const error = isSignup ? await signUp(email, password) : await signIn(email, password);
    setLoading(false);
    if (error) {
      Alert.alert("Gagal", error.message);
    } else {
      if (isSignup) {
        Alert.alert("Sukses!", "Akun dibuat. Cek email untuk verifikasi.");
      } else {
        router.replace("/(tabs)");
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>💰</Text>
        </View>
        <Text style={styles.title}>OprexDuit</Text>
        <Text style={styles.subtitle}>Ngatur duit, beres.</Text>
      </View>

      {/* Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{isSignup ? "Buat Akun" : "Masuk"}</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.btn} onPress={handleAuth} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{isSignup ? "Daftar" : "Masuk"}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignup((p) => !p)} style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={{ color: "#64748b", fontSize: 13 }}>
            {isSignup ? "Sudah punya akun? " : "Belum punya akun? "}
            <Text style={{ color: "#0f766e", fontWeight: "600" }}>
              {isSignup ? "Masuk" : "Daftar"}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f766e",
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoText: { fontSize: 36 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#0f172a",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  btn: {
    backgroundColor: "#0f766e",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  btnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
