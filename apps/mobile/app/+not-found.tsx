import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Page introuvable" }} />
      <Text style={styles.title}>404</Text>
      <Text style={styles.sub}>Cette route n&apos;existe pas.</Text>
      <Link href="/(tabs)" style={styles.link}>
        Retour à l&apos;accueil
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FDFAF5",
  },
  title: { fontSize: 32, fontWeight: "700", color: "#1A2C47" },
  sub: { marginTop: 8, color: "#4A6FA5", marginBottom: 24 },
  link: { color: "#C1440E", fontWeight: "600", fontSize: 16 },
});
