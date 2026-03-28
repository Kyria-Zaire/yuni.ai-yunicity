import { useAuth } from "@yuni/auth";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { YuniVoiceFAB } from "@/components/YuniVoiceFAB";

export default function ProfileScreen() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <View style={{ flex: 1 }}>
    <View style={{ flex: 1, padding: 20, backgroundColor: "#FDFAF5" }}>
      <Text style={{ fontSize: 20, fontWeight: "600", color: "#1A2C47" }}>
        Moi
      </Text>
      {user ? (
        <Text style={{ marginTop: 8, color: "#6B6860" }}>{user.email}</Text>
      ) : null}
      {!isAuthenticated ? (
        <Pressable
          style={{
            marginTop: 20,
            backgroundColor: "#C1440E",
            padding: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={() => router.push("/login")}
        >
          <Text style={{ color: "#FDFAF5", fontWeight: "600" }}>Connexion</Text>
        </Pressable>
      ) : (
        <Pressable
          style={{
            marginTop: 20,
            backgroundColor: "#2E4A75",
            padding: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
          onPress={logout}
        >
          <Text style={{ color: "#FDFAF5", fontWeight: "600" }}>Déconnexion</Text>
        </Pressable>
      )}
    </View>
    <YuniVoiceFAB />
    </View>
  );
}
