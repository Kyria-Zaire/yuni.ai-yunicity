import type { UserInput } from "@yuni/api-client";
import {
  useQuests,
  useRecommendations,
  useVitality,
  useXPProfile,
} from "@yuni/api-client/react";
import { useAuth } from "@yuni/auth";
import { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DEFAULT_CITY_SLUG, DEFAULT_ZONE } from "@/lib/constants";

function SkeletonBlock({ h }: { h: number }) {
  return (
    <View
      style={[styles.skeleton, { height: h }]}
      accessibilityLabel="Chargement"
    />
  );
}

export default function HomeScreen() {
  const { token, user } = useAuth();
  const recoInput: UserInput = useMemo(
    () => ({
      user_id_hash:
        user?.hash ??
        "0000000000000000000000000000000000000000000000000000000000000000",
      city: DEFAULT_CITY_SLUG,
      interests: ["culture", "food"],
      points: 0,
      geo: { lat_truncated: 49.26, lng_truncated: 4.03 },
    }),
    [user?.hash],
  );

  const vit = useVitality(DEFAULT_CITY_SLUG, DEFAULT_ZONE, Boolean(token));
  const reco = useRecommendations(recoInput, Boolean(token));
  const quests = useQuests(DEFAULT_CITY_SLUG, undefined, Boolean(token));
  const xp = useXPProfile(Boolean(token));

  const r = reco.data;
  const actors =
    r && "data" in r && r.data
      ? r.data.actors.slice(0, 2)
      : [];

  const previewQuest = quests.data?.[0];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Bonjour · Reims</Text>
        <View style={styles.xpBadge}>
          <Text style={styles.xpBadgeText}>
            {xp.isLoading
              ? "…"
              : xp.data
                ? `${xp.data.total_xp} XP`
                : "— XP"}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Vitalité</Text>
      {vit.isLoading ? (
        <SkeletonBlock h={72} />
      ) : vit.data ? (
        <View style={styles.vitalityCard}>
          <Text style={styles.vitScore}>{vit.data.data.score}</Text>
          <Text style={styles.vitGrade}>{vit.data.data.grade}</Text>
          <Text style={styles.vitHint}>Votre ville est vivante</Text>
        </View>
      ) : (
        <Text style={styles.muted}>
          {token
            ? "Vitalité indisponible pour cette zone."
            : "Connecte-toi pour voir la vitalité."}
        </Text>
      )}

      <Text style={styles.sectionLabel}>Pour toi</Text>
      {reco.isLoading ? (
        <View style={styles.row}>
          <SkeletonBlock h={120} />
          <View style={{ width: 12 }} />
          <SkeletonBlock h={120} />
        </View>
      ) : reco.data && "eligible" in reco.data && reco.data.eligible === false ? (
        <Text style={styles.muted}>{reco.data.message}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {actors.map((a) => (
            <View key={a.id} style={styles.recoCard}>
              <View style={styles.recoImg} />
              <Text style={styles.recoName} numberOfLines={1}>
                {a.name}
              </Text>
              <Text style={styles.recoCat} numberOfLines={1}>
                {a.category}
              </Text>
              <Text style={styles.recoScore}>{a.score.toFixed(1)}</Text>
            </View>
          ))}
          {actors.length === 0 ? (
            <Text style={styles.muted}>Aucune recommandation pour l’instant.</Text>
          ) : null}
        </ScrollView>
      )}

      <Text style={styles.sectionLabel}>Quêtes actives</Text>
      {quests.isLoading ? (
        <SkeletonBlock h={100} />
      ) : previewQuest ? (
        <View style={styles.questCard}>
          <Text style={styles.questTitle} numberOfLines={2}>
            {previewQuest.title}
          </Text>
          <Text style={styles.muted} numberOfLines={2}>
            {previewQuest.description}
          </Text>
          <Text style={styles.questMeta}>
            {previewQuest.difficulty} · {previewQuest.xp_reward} XP
          </Text>
        </View>
      ) : (
        <Text style={styles.muted}>Aucune quête listée.</Text>
      )}

      {!token ? (
        <Text style={styles.hint}>
          Astuce : connecte-toi depuis l’onglet Moi ou l’écran login pour charger
          les données API.
        </Text>
      ) : null}

      {reco.isFetching || vit.isFetching ? (
        <ActivityIndicator color="#C1440E" style={{ marginTop: 16 }} />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#FDFAF5" },
  scrollContent: { padding: 20, paddingBottom: 120 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#1A2C47" },
  xpBadge: {
    backgroundColor: "#EDD9A8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  xpBadgeText: { fontWeight: "600", color: "#1A2C47", fontSize: 13 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A6FA5",
    marginBottom: 8,
    marginTop: 16,
  },
  skeleton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#EDD9A8",
    opacity: 0.5,
  },
  row: { flexDirection: "row" },
  vitalityCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EDD9A8",
  },
  vitScore: { fontSize: 32, fontWeight: "700", color: "#C1440E" },
  vitGrade: { fontSize: 18, color: "#1A2C47", marginTop: 4 },
  vitHint: { fontSize: 14, color: "#6B6860", marginTop: 8 },
  recoCard: {
    width: 160,
    marginRight: 12,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDD9A8",
  },
  recoImg: {
    height: 72,
    borderRadius: 8,
    backgroundColor: "#EDD9A8",
    marginBottom: 8,
  },
  recoName: { fontWeight: "600", color: "#1A2C47" },
  recoCat: { fontSize: 12, color: "#6B6860", marginTop: 4 },
  recoScore: { fontSize: 12, color: "#C1440E", marginTop: 6 },
  questCard: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EDD9A8",
  },
  questTitle: { fontSize: 16, fontWeight: "600", color: "#1A2C47" },
  questMeta: { marginTop: 8, color: "#2D6A4F", fontWeight: "600" },
  muted: { color: "#6B6860", fontSize: 14 },
  hint: { marginTop: 24, fontSize: 13, color: "#8E9BB0" },
});
