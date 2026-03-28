import { Text, View } from "react-native";

export default function ReportModal() {
  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        backgroundColor: "#FDFAF5",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "600", color: "#1A2C47" }}>
        Signalement
      </Text>
      <Text style={{ marginTop: 12, color: "#4A6FA5" }}>
        Le flux vocal et GPS seront branchés dans FE-014 (signalements vocaux).
      </Text>
    </View>
  );
}
