import { AlertTriangle, Mic } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";

export function MapFloatingActions() {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable
        accessibilityLabel="Ouvrir le signalement citoyen"
        style={({ pressed }) => [styles.fab, styles.fabReport, pressed && styles.pressed]}
        onPress={() => router.push("/(modals)/report")}
      >
        <AlertTriangle color="#FDFAF5" size={26} strokeWidth={2.2} />
      </Pressable>
      <Pressable
        accessibilityLabel="Ouvrir Hey Yuni"
        style={({ pressed }) => [styles.fab, styles.fabVoice, pressed && styles.pressed]}
        onPress={() => router.push("/(modals)/voice")}
      >
        <Mic color="#FDFAF5" size={28} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 24,
    bottom: 24,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  fabReport: {
    backgroundColor: "#2E4A75",
  },
  fabVoice: {
    backgroundColor: "#C1440E",
  },
  pressed: { opacity: 0.9 },
});
