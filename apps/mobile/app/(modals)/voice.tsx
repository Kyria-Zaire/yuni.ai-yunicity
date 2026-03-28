import { useAuth } from "@yuni/auth";
import { useYuniAIClient } from "@yuni/api-client/react";
import { Audio } from "expo-av";
import { readAsStringAsync } from "expo-file-system/legacy";
import { router } from "expo-router";
import { X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DEFAULT_CITY_SLUG } from "@/lib/constants";
import {
  type VoiceState,
  VOICE_CIRCLE_COLORS,
  VOICE_STATE_LABELS,
} from "@/lib/voiceLabels";

export default function VoiceModal() {
  const { token } = useAuth();
  const client = useYuniAIClient();
  const [state, setState] = useState<VoiceState>("idle");
  const [transcription, setTranscription] = useState("");
  const [response, setResponse] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const wsRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    pulseLoopRef.current?.stop();
    pulseLoopRef.current = null;
    if (state === "listening") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoopRef.current = loop;
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      pulseLoopRef.current?.stop();
    };
  }, [state, pulseAnim]);

  useEffect(() => {
    if (!token) {
      return;
    }
    const ws = client.createVoiceSession(sessionId, token, DEFAULT_CITY_SLUG);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string) as {
        type: string;
        text?: string;
        data?: string;
        message?: string;
      };
      switch (msg.type) {
        case "transcription":
          if (msg.text) {
            setTranscription(msg.text);
          }
          break;
        case "thinking":
          setState("processing");
          break;
        case "text_response":
          if (msg.text) {
            setResponse(msg.text);
          }
          setState("speaking");
          break;
        case "audio_response":
          if (msg.data) {
            void playAudio(msg.data);
          }
          break;
        case "error":
          setState("error");
          if (msg.message) {
            setResponse(msg.message);
          }
          break;
        default:
          break;
      }
    };
    ws.onerror = () => {
      setState("error");
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [sessionId, token, client]);

  async function startListening() {
    if (!token) {
      setState("error");
      setResponse("Connecte-toi pour utiliser la voix.");
      return;
    }
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setState("listening");
      setTranscription("");
      setResponse("");
    } catch {
      setState("error");
    }
  }

  async function stopListening() {
    if (!recordingRef.current) {
      return;
    }
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      if (!uri) {
        return;
      }

      setState("processing");

      const base64 = await readAsStringAsync(uri, {
        encoding: "base64",
      });

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "audio_chunk",
            data: base64,
            mime: "audio/m4a",
          }),
        );
        wsRef.current.send(JSON.stringify({ type: "audio_end" }));
      }

      recordingRef.current = null;
    } catch {
      setState("error");
    }
  }

  async function playAudio(base64mp3: string) {
    try {
      const { sound } = await Audio.Sound.createAsync({
        uri: `data:audio/mp3;base64,${base64mp3}`,
      });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setState("idle");
          void sound.unloadAsync();
        }
      });
    } catch {
      setState("idle");
    }
  }

  const circleColor = VOICE_CIRCLE_COLORS[state];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Pressable
        accessibilityLabel="Fermer Hey Yuni"
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <X size={24} color="#4A6FA5" />
      </Pressable>

      <Text style={styles.title}>Hey Yuni</Text>
      <Text style={styles.city}>Reims</Text>

      <View style={styles.circleContainer}>
        <Animated.View
          style={[
            styles.circleOuter,
            {
              backgroundColor: `${circleColor}33`,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <Pressable
          accessibilityLabel="Maintenir pour parler"
          style={[styles.circleInner, { backgroundColor: circleColor }]}
          onPressIn={startListening}
          onPressOut={stopListening}
        >
          {state === "processing" ? (
            <ActivityIndicator color="white" size="large" />
          ) : (
            <Text style={styles.micIcon}>🎤</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.stateLabel}>{VOICE_STATE_LABELS[state]}</Text>

      {transcription ? (
        <View style={styles.bubble}>
          <Text style={styles.bubbleLabel}>Toi</Text>
          <Text style={styles.bubbleText}>{transcription}</Text>
        </View>
      ) : null}

      {response ? (
        <View style={[styles.bubble, styles.bubbleYuni]}>
          <Text style={[styles.bubbleLabel, styles.bubbleLabelYuni]}>Yuni</Text>
          <Text style={styles.bubbleText}>{response}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A2C47",
    alignItems: "center",
    paddingTop: 20,
  },
  closeButton: {
    position: "absolute",
    top: 56,
    right: 24,
    padding: 8,
    zIndex: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FDFAF5",
    marginTop: 60,
  },
  city: {
    fontSize: 16,
    color: "#8E9BB0",
    marginTop: 4,
    marginBottom: 40,
  },
  circleContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 200,
    height: 200,
  },
  circleOuter: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  circleInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  micIcon: { fontSize: 40 },
  stateLabel: {
    color: "#D4DAE2",
    fontSize: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  bubble: {
    backgroundColor: "#2E4A75",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    width: "88%",
  },
  bubbleYuni: {
    backgroundColor: "#1B4733",
  },
  bubbleLabel: {
    color: "#8E9BB0",
    fontSize: 12,
    marginBottom: 4,
  },
  bubbleLabelYuni: {
    color: "#72B885",
  },
  bubbleText: {
    color: "#FDFAF5",
    fontSize: 16,
    lineHeight: 24,
  },
});
