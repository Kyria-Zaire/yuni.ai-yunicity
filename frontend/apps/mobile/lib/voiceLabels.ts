export type VoiceState = "idle" | "listening" | "processing" | "speaking" | "error";

export const VOICE_STATE_LABELS: Record<VoiceState, string> = {
  idle: "Appuie pour parler",
  listening: "J'écoute...",
  processing: "Yuni réfléchit...",
  speaking: "Yuni répond",
  error: "Une erreur est survenue",
};

export const VOICE_CIRCLE_COLORS: Record<VoiceState, string> = {
  idle: "#C1440E",
  listening: "#E05A3A",
  processing: "#6B8CFF",
  speaking: "#2D6A4F",
  error: "#8B2F08",
};
