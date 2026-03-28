import { Text, View } from "react-native";

export default function MapScreen() {
  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#FDFAF5" }}>
      <Text style={{ fontSize: 20, fontWeight: "600", color: "#1A2C47" }}>
        Carte
      </Text>
      <Text style={{ marginTop: 8, color: "#6B6860" }}>
        react-native-maps et marqueurs — FE-013.
      </Text>
    </View>
  );
}
