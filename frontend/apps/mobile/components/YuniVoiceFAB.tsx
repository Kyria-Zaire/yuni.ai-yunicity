import { router } from "expo-router";
import { Mic } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";

export function YuniVoiceFAB() {
  return (
    <Pressable
      accessibilityLabel="Ouvrir Hey Yuni"
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      onPress={() => router.push("/(modals)/voice")}
      onLongPress={() => router.push("/(modals)/voice")}
    >
      <Mic color="#FDFAF5" size={28} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#C1440E",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  fabPressed: {
    opacity: 0.9,
  },
});
