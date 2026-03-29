"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useYuniAIClient } from "@yuni/api-client/react";
import { useAuth } from "@yuni/auth";
import { VoiceButton, type VoiceState } from "@yuni/ui";

import { useClientSessionId } from "@/hooks/useClientSessionId";

type ChatBubble = { role: "user" | "assistant"; text: string };

interface WsMessage {
  type: string;
  text?: string;
  data?: string;
  mime?: string;
  message?: string;
}

function mapVoiceState(
  s: "idle" | "recording" | "thinking" | "speaking",
): VoiceState {
  if (s === "recording") {
    return "listening";
  }
  if (s === "thinking") {
    return "processing";
  }
  if (s === "speaking") {
    return "speaking";
  }
  return "idle";
}

export function HeyYuniWeb({ city }: { city: string }) {
  const client = useYuniAIClient();
  const { getAccessToken } = useAuth();
  const sessionId = useClientSessionId();
  const [voiceUi, setVoiceUi] = useState<
    "idle" | "recording" | "thinking" | "speaking"
  >("idle");
  const [transcription, setTranscription] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pushActive = useRef(false);

  const playBase64Audio = useCallback(async (b64: string, mime: string) => {
    const url = `data:${mime};base64,${b64}`;
    const audio = new Audio(url);
    setVoiceUi("speaking");
    await audio.play().catch(() => undefined);
    audio.onended = () => setVoiceUi("idle");
  }, []);

  const sendAudioBlob = useCallback(
    async (blob: Blob) => {
      if (!sessionId) {
        return;
      }
      const token = getAccessToken();
      if (!token) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: "Connecte-toi pour utiliser la voix.",
          },
        ]);
        return;
      }
      const buf = await blob.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i]);
      }
      const b64 = btoa(binary);
      const chunkSize = 48_000;
      const ws = client.createVoiceSession(sessionId, token, city);
      wsRef.current = ws;

      ws.onopen = () => {
        for (let i = 0; i < b64.length; i += chunkSize) {
          const part = b64.slice(i, i + chunkSize);
          ws.send(JSON.stringify({ type: "audio_chunk", data: part }));
        }
        ws.send(JSON.stringify({ type: "audio_end" }));
      };

      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data as string) as WsMessage;
        if (msg.type === "thinking") {
          setThinking(true);
          setVoiceUi("thinking");
        }
        if (msg.type === "transcription" && msg.text) {
          setTranscription(msg.text);
          setThinking(false);
          setMessages((prev) => [...prev, { role: "user", text: msg.text ?? "" }]);
        }
        if (msg.type === "text_response" && msg.text) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: msg.text ?? "" },
          ]);
        }
        if (msg.type === "audio_response" && msg.data && msg.mime) {
          void playBase64Audio(msg.data, msg.mime);
        }
        if (msg.type === "error") {
          setThinking(false);
          setVoiceUi("idle");
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              text: msg.message ?? "Erreur voix",
            },
          ]);
        }
      };

      ws.onerror = () => {
        setThinking(false);
        setVoiceUi("idle");
      };
      ws.onclose = () => {
        wsRef.current = null;
        setThinking(false);
        setVoiceUi("idle");
      };
    },
    [city, client, getAccessToken, playBase64Audio, sessionId],
  );

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      mediaRef.current?.stop();
    };
  }, []);

  const stopRecording = useCallback(() => {
    const rec = mediaRef.current;
    if (!rec || rec.state === "inactive") {
      return;
    }
    rec.stop();
    mediaRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        chunksRef.current = [];
        setVoiceUi("thinking");
        await sendAudioBlob(blob);
      };
      rec.start();
      mediaRef.current = rec;
      setVoiceUi("recording");
      setTranscription("");
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Micro refusé ou indisponible.",
        },
      ]);
      setVoiceUi("idle");
    }
  }, [sendAudioBlob]);

  const onPointerDown = () => {
    if (pushActive.current) {
      return;
    }
    pushActive.current = true;
    void startRecording();
  };

  const onPointerUp = () => {
    if (!pushActive.current) {
      return;
    }
    pushActive.current = false;
    stopRecording();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <VoiceButton
          state={mapVoiceState(voiceUi)}
          className="h-20 w-20 text-[10px]"
        />
      </div>
      <p className="text-center text-xs text-yuni-slate-500">
        Maintenir pour parler (push-to-talk)
      </p>
      {thinking ? (
        <p className="animate-pulse text-sm font-medium text-yuni-terracotta-600">
          Yuni réfléchit…
        </p>
      ) : null}
      {transcription ? (
        <p className="max-w-md text-center text-sm text-yuni-slate-700">
          « {transcription} »
        </p>
      ) : null}
      <div className="flex max-h-48 w-full max-w-md flex-col gap-2 overflow-y-auto rounded-yuni-lg bg-yuni-wheat-50/80 p-3">
        {messages.map((m, i) => (
          <div
            key={`${i}-${m.text.slice(0, 12)}`}
            className={
              m.role === "user"
                ? "self-end rounded-yuni-md bg-yuni-slate-100 px-3 py-2 text-sm text-yuni-slate-800"
                : "self-start rounded-yuni-md border border-yuni-terracotta-200 bg-white px-3 py-2 text-sm text-yuni-slate-800"
            }
          >
            {m.text}
          </div>
        ))}
      </div>
    </div>
  );
}
