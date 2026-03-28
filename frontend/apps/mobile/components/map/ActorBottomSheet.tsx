import type { MapActor } from "@yuni/api-client";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import * as Linking from "expo-linking";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  actor: MapActor | null;
  distanceKm?: number | null;
  onClose: () => void;
  onVoiceGuide: () => void;
};

export default function ActorBottomSheet({
  actor,
  distanceKm,
  onClose,
  onVoiceGuide,
}: Props) {
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ["42%", "68%"], []);

  function openMapsDirections() {
    if (!actor) {
      return;
    }
    const { lat, lng } = actor.geo;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    void Linking.openURL(url);
  }

  return (
    <BottomSheet
      index={actor ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={(index) => {
        if (index === -1) {
          onClose();
        }
      }}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView
        style={[styles.content, { paddingBottom: insets.bottom + 16 }]}
      >
        {actor ? (
          <>
            <Text style={styles.name}>{actor.name}</Text>
            <Text style={styles.meta}>
              {actor.category}
              {distanceKm != null
                ? ` · ${distanceKm.toFixed(1)} km`
                : ""}
            </Text>
            <Text style={styles.desc} numberOfLines={2}>
              {actor.description}
            </Text>
            {actor.semantic_score != null ? (
              <Text style={styles.score}>
                Score sémantique : {actor.semantic_score.toFixed(2)}
              </Text>
            ) : null}
            <View style={styles.row}>
              <Pressable
                style={[styles.btn, styles.btnPrimary]}
                onPress={onVoiceGuide}
              >
                <Text style={styles.btnPrimaryText}>Demander à Yuni</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnOutline]}
                onPress={openMapsDirections}
              >
                <Text style={styles.btnOutlineText}>Itinéraire</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: "#FDFAF5" },
  handle: { backgroundColor: "#EDD9A8" },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A2C47",
  },
  meta: { marginTop: 4, color: "#4A6FA5", fontSize: 14 },
  desc: { marginTop: 12, color: "#6B6860", fontSize: 15, lineHeight: 22 },
  score: { marginTop: 8, fontSize: 13, color: "#C1440E" },
  row: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPrimary: { backgroundColor: "#C1440E" },
  btnPrimaryText: { color: "#FDFAF5", fontWeight: "600", fontSize: 15 },
  btnOutline: {
    borderWidth: 1,
    borderColor: "#2E4A75",
    backgroundColor: "transparent",
  },
  btnOutlineText: { color: "#2E4A75", fontWeight: "600", fontSize: 15 },
});
