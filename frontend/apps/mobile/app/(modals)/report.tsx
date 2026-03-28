import type { ReportCategory } from "@yuni/api-client";
import { useCreateReport } from "@yuni/api-client/react";
import { useAuth } from "@yuni/auth";
import { Audio } from "expo-av";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useState, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DEFAULT_CITY_SLUG } from "@/lib/constants";
import { inferReportCategory } from "@/lib/reportCategory";
import { truncateToTwoDecimals } from "@/lib/reportGeo";

const API_BASE =
  process.env.EXPO_PUBLIC_YUNI_API_URL ?? "http://127.0.0.1:8000";

const CATEGORY_CHOICES: { value: ReportCategory; label: string; emoji: string }[] =
  [
    { value: "voirie", label: "Voirie", emoji: "🛤️" },
    { value: "eclairage", label: "Éclairage", emoji: "💡" },
    { value: "proprete", label: "Propreté", emoji: "🗑️" },
    { value: "securite", label: "Sécurité", emoji: "🛡️" },
    { value: "nature", label: "Nature", emoji: "🌿" },
    { value: "infra", label: "Infrastructure", emoji: "🔧" },
    { value: "autre", label: "Autre", emoji: "📌" },
  ];

type Step = 1 | 2 | 3;

export default function ReportModal() {
  const { getAccessToken } = useAuth();
  const reportMutation = useCreateReport();

  const [step, setStep] = useState<Step>(1);
  const [inputMode, setInputMode] = useState<"voice" | "text" | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [includeLocation, setIncludeLocation] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [success, setSuccess] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  async function transcribeUri(uri: string): Promise<string> {
    const token = getAccessToken();
    const form = new FormData();
    form.append(
      "audio",
      { uri, name: "recording.m4a", type: "audio/m4a" } as unknown as Blob,
    );
    form.append(
      "metadata",
      JSON.stringify({
        language: "fr",
        city: DEFAULT_CITY_SLUG,
        context: "report",
      }),
    );
    const res = await fetch(`${API_BASE}/v1/voice/transcribe`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      throw new Error("Transcription indisponible");
    }
    const json = (await res.json()) as { text: string };
    return json.text;
  }

  async function startVoice() {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = rec;
      setRecording(rec);
    } catch {
      setVoiceBusy(false);
    }
  }

  async function stopVoice() {
    const rec = recordingRef.current;
    if (!rec) {
      return;
    }
    setVoiceBusy(true);
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;
      setRecording(null);
      if (!uri) {
        return;
      }
      const text = await transcribeUri(uri);
      setDescription(text);
      setCategory(inferReportCategory(text));
    } catch {
      setDescription("");
    } finally {
      setVoiceBusy(false);
    }
  }

  async function submit() {
    if (!description.trim() || !category) {
      return;
    }
    let geo: { lat_truncated: number; lng_truncated: number } | null = null;
    if (includeLocation) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        geo = truncateToTwoDecimals(
          loc.coords.latitude,
          loc.coords.longitude,
        );
      }
    }
    await reportMutation.mutateAsync({
      city: DEFAULT_CITY_SLUG,
      description: description.trim(),
      category,
      geo,
      source: inputMode === "voice" ? "voice" : "text",
    });
    setSuccess(true);
    setTimeout(() => {
      router.back();
    }, 2000);
  }

  if (success) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Signalement envoyé</Text>
        <Text style={styles.successXp}>+15 XP · Gardien du quartier</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Signalement citoyen</Text>

        {step === 1 ? (
          <View style={styles.block}>
            <Text style={styles.label}>Comment décrire le problème ?</Text>
            <Pressable
              style={styles.modeBtn}
              onPress={() => {
                setInputMode("voice");
                setStep(2);
              }}
            >
              <Text style={styles.modeEmoji}>🎤</Text>
              <Text style={styles.modeText}>Parler à Yuni</Text>
            </Pressable>
            <Pressable
              style={styles.modeBtn}
              onPress={() => {
                setInputMode("text");
                setStep(2);
              }}
            >
              <Text style={styles.modeEmoji}>✍️</Text>
              <Text style={styles.modeText}>Écrire</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 2 && inputMode === "voice" ? (
          <View style={styles.block}>
            <Text style={styles.hint}>
              Décris le problème que tu observes (enregistrement court).
            </Text>
            <Pressable
              style={[styles.recordBtn, recording ? styles.recordingOn : null]}
              onPressIn={startVoice}
              onPressOut={() => {
                void stopVoice();
              }}
            >
              {voiceBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.recordLabel}>
                  {recording ? "Relâche pour envoyer" : "Maintenir pour parler"}
                </Text>
              )}
            </Pressable>
            {description ? (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>Transcription</Text>
                <Text style={styles.previewText}>{description}</Text>
                {category ? (
                  <Text style={styles.catAuto}>
                    Catégorie détectée : {category}
                  </Text>
                ) : null}
                <View style={styles.rowBtn}>
                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={() => {
                      setDescription("");
                      setCategory(null);
                    }}
                  >
                    <Text style={styles.secondaryBtnText}>Recommencer</Text>
                  </Pressable>
                  <Pressable
                    style={styles.primaryBtn}
                    onPress={() => setStep(3)}
                  >
                    <Text style={styles.primaryBtnText}>Confirmer</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <Pressable onPress={() => setStep(1)}>
              <Text style={styles.back}>← Retour</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 2 && inputMode === "text" ? (
          <View style={styles.block}>
            <TextInput
              style={styles.input}
              placeholder="Décris le problème (max 500 caractères)"
              placeholderTextColor="#8E9BB0"
              multiline
              maxLength={500}
              value={description}
              onChangeText={setDescription}
            />
            <Text style={styles.counter}>{description.length}/500</Text>
            <Text style={styles.label}>Catégorie</Text>
            <View style={styles.grid}>
              {CATEGORY_CHOICES.map((c) => (
                <Pressable
                  key={c.value}
                  style={[
                    styles.chip,
                    category === c.value ? styles.chipOn : null,
                  ]}
                  onPress={() => setCategory(c.value)}
                >
                  <Text style={styles.chipEmoji}>{c.emoji}</Text>
                  <Text style={styles.chipText}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={[
                styles.primaryBtn,
                styles.full,
                !description.trim() || !category ? styles.disabled : null,
              ]}
              disabled={!description.trim() || !category}
              onPress={() => setStep(3)}
            >
              <Text style={styles.primaryBtnText}>Continuer</Text>
            </Pressable>
            <Pressable onPress={() => setStep(1)}>
              <Text style={styles.back}>← Retour</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.block}>
            <Text style={styles.label}>Résumé</Text>
            <Text style={styles.summary}>{description}</Text>
            <Text style={styles.summaryCat}>Catégorie : {category}</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Inclure ma position (tronquée)</Text>
              <Switch
                value={includeLocation}
                onValueChange={setIncludeLocation}
                trackColor={{ false: "#EDD9A8", true: "#C1440E" }}
              />
            </View>
            <Text style={styles.rgpd}>
              La position est arrondie à 2 décimales (~1 km) avant envoi.
            </Text>
            <Pressable
              style={[
                styles.primaryBtn,
                styles.full,
                reportMutation.isPending ? styles.disabled : null,
              ]}
              disabled={reportMutation.isPending}
              onPress={() => void submit()}
            >
              {reportMutation.isPending ? (
                <ActivityIndicator color="#FDFAF5" />
              ) : (
                <Text style={styles.primaryBtnText}>Envoyer le signalement</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setStep(2)}>
              <Text style={styles.back}>← Retour</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FDFAF5" },
  scroll: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FDFAF5" },
  title: { fontSize: 22, fontWeight: "700", color: "#1A2C47", marginBottom: 16 },
  block: { gap: 12 },
  label: { fontWeight: "600", color: "#2E4A75", marginTop: 8 },
  hint: { color: "#6B6860", marginBottom: 8 },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EDD9A8",
  },
  modeEmoji: { fontSize: 28 },
  modeText: { fontSize: 17, fontWeight: "600", color: "#1A2C47" },
  recordBtn: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: "#C1440E",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  recordingOn: { backgroundColor: "#E05A3A" },
  recordLabel: { color: "#FDFAF5", fontWeight: "600" },
  preview: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EDD9A8",
  },
  previewLabel: { fontSize: 12, color: "#8E9BB0" },
  previewText: { marginTop: 4, color: "#1A2C47" },
  catAuto: { marginTop: 8, color: "#C1440E", fontWeight: "600" },
  rowBtn: { flexDirection: "row", gap: 12, marginTop: 12 },
  secondaryBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2E4A75",
    alignItems: "center",
  },
  secondaryBtnText: { color: "#2E4A75", fontWeight: "600" },
  primaryBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#C1440E",
    alignItems: "center",
  },
  primaryBtnText: { color: "#FDFAF5", fontWeight: "600" },
  full: { flex: 0 },
  disabled: { opacity: 0.5 },
  back: { color: "#4A6FA5", marginTop: 12 },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#EDD9A8",
    borderRadius: 12,
    padding: 12,
    textAlignVertical: "top",
    color: "#1A2C47",
    backgroundColor: "#fff",
  },
  counter: { alignSelf: "flex-end", color: "#8E9BB0", fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    width: "30%",
    minWidth: 100,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EDD9A8",
    alignItems: "center",
  },
  chipOn: { borderColor: "#C1440E", backgroundColor: "#FFF5F0" },
  chipEmoji: { fontSize: 22 },
  chipText: { fontSize: 11, color: "#1A2C47", textAlign: "center" },
  summary: { color: "#1A2C47", lineHeight: 22 },
  summaryCat: { color: "#4A6FA5", fontWeight: "600" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  toggleLabel: { flex: 1, color: "#1A2C47", marginRight: 12 },
  rgpd: { fontSize: 12, color: "#8E9BB0", marginTop: 8 },
  successIcon: { fontSize: 48 },
  successTitle: { fontSize: 20, fontWeight: "700", color: "#1A2C47", marginTop: 12 },
  successXp: { marginTop: 8, color: "#2D6A4F", fontWeight: "600" },
});
