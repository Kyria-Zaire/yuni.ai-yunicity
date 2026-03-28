import { Text, View } from "react-native";

import { YuniVoiceFAB } from "@/components/YuniVoiceFAB";

export default function QuestsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20, backgroundColor: "#FDFAF5" }}>
        <Text style={{ fontSize: 20, fontWeight: "600", color: "#1A2C47" }}>
          Quêtes
        </Text>
        <Text style={{ marginTop: 8, color: "#6B6860" }}>
          Liste et progression — alignement FE-009 / FE-013.
        </Text>
      </View>
      <YuniVoiceFAB />
    </View>
  );
}
