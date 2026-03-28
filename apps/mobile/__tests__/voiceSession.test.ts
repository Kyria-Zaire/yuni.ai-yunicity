import {
  VOICE_CIRCLE_COLORS,
  VOICE_STATE_LABELS,
  type VoiceState,
} from "../lib/voiceLabels";
import { parseVoiceWsMessage } from "../lib/voiceWsMessage";

describe("VoiceSession — lib pure (FE-012)", () => {
  it("expose les libellés pour tous les états (idle → speaking)", () => {
    const states: VoiceState[] = [
      "idle",
      "listening",
      "processing",
      "speaking",
      "error",
    ];
    for (const s of states) {
      expect(VOICE_STATE_LABELS[s].length).toBeGreaterThan(0);
      expect(VOICE_CIRCLE_COLORS[s]).toMatch(/^#/);
    }
  });

  it("parse transcription et réponse texte", () => {
    const t = parseVoiceWsMessage(
      JSON.stringify({ type: "transcription", text: "Bonjour" }),
    );
    expect(t.type).toBe("transcription");
    if (t.type === "transcription") {
      expect(t.text).toBe("Bonjour");
    }
    const r = parseVoiceWsMessage(
      JSON.stringify({ type: "text_response", text: "Salut depuis Yuni" }),
    );
    expect(r.type).toBe("text_response");
    if (r.type === "text_response") {
      expect(r.text).toBe("Salut depuis Yuni");
    }
  });

  it("parse thinking et audio_response", () => {
    const th = parseVoiceWsMessage(JSON.stringify({ type: "thinking" }));
    expect(th.type).toBe("thinking");
    const au = parseVoiceWsMessage(
      JSON.stringify({ type: "audio_response", data: "AAA" }),
    );
    expect(au.type).toBe("audio_response");
    if (au.type === "audio_response") {
      expect(au.data).toBe("AAA");
    }
  });
});
