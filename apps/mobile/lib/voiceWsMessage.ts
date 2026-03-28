/**
 * Parse un message JSON WebSocket voix (aligné backend Yuni).
 * Fonction pure — testable sans runtime natif.
 */
export type VoiceWsPayload =
  | { type: "transcription"; text: string }
  | { type: "thinking" }
  | { type: "text_response"; text: string }
  | { type: "audio_response"; data: string }
  | { type: "error"; message?: string }
  | { type: string; [k: string]: unknown };

export function parseVoiceWsMessage(raw: string): VoiceWsPayload {
  return JSON.parse(raw) as VoiceWsPayload;
}
