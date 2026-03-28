import { useAuth } from "@yuni/auth";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("demo@yuni.ai");
  const [password, setPassword] = useState("demo");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit() {
    try {
      setErr(null);
      await login(email, password);
      router.replace("/(tabs)");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur de connexion");
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Connexion Yuni</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor="#8E9BB0"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor="#8E9BB0"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {err ? <Text style={styles.err}>{err}</Text> : null}
      <Pressable style={styles.btn} onPress={onSubmit}>
        <Text style={styles.btnText}>Continuer</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#FDFAF5",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A2C47",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#EDD9A8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    color: "#1A2C47",
    backgroundColor: "#fff",
  },
  err: { color: "#C1440E", marginBottom: 8 },
  btn: {
    backgroundColor: "#C1440E",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#FDFAF5", fontWeight: "600", fontSize: 16 },
});
