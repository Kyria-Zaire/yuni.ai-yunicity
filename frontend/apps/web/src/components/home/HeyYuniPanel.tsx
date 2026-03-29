"use client";

import Link from "next/link";
import { useState } from "react";

import { useChatMutation } from "@yuni/api-client/react";
import { useAuth } from "@yuni/auth";

import { useClientSessionId } from "@/hooks/useClientSessionId";

export type HeyYuniPanelMode = "public" | "citizen";

export function HeyYuniPanel({
  city,
  mode = "citizen",
}: {
  city: string;
  mode?: HeyYuniPanelMode;
}) {
  const { user, isAuthenticated } = useAuth();
  const sessionId = useClientSessionId();
  const [question, setQuestion] = useState("");
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const chat = useChatMutation();

  const intro =
    mode === "public"
      ? "Pose une question sur ta ville — réponse par l’API quand tu es connecté."
      : "Bonjour ! Que veux-tu faire aujourd’hui ?";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = question.trim();
    if (!sessionId || !isAuthenticated || !user?.hash || !msg) {
      return;
    }
    chat.mutate(
      {
        session_id: sessionId,
        user_id_hash: user.hash,
        city,
        message: msg,
      },
      {
        onSuccess: (res) => {
          setLastResponse(res.message.content);
          setQuestion("");
        },
      },
    );
  }

  return (
    <div
      id="hey-yuni-panel"
      className="mt-6 rounded-yuni-lg border border-yuni-slate-200 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yuni-terracotta-500">
            <span className="text-xs font-bold text-white">Y</span>
          </div>
          <h3 className="font-display text-base font-bold text-yuni-slate-900">
            Hey Yuni
          </h3>
        </div>
        <Link
          href="/voice"
          className="text-sm font-medium text-yuni-slate-500 underline-offset-2 hover:text-yuni-terracotta-600 hover:underline"
        >
          Ouvrir Hey Yuni
        </Link>
      </div>
      {lastResponse ? (
        <p className="mb-3 line-clamp-3 text-sm text-yuni-slate-600">
          {lastResponse}
        </p>
      ) : (
        <p className="mb-3 text-sm text-yuni-slate-500">{intro}</p>
      )}
      <form onSubmit={onSubmit} className="flex gap-2">
        <label htmlFor="hey-yuni-ask" className="sr-only">
          Votre question
        </label>
        <input
          id="hey-yuni-ask"
          type="text"
          value={question}
          onChange={(ev) => setQuestion(ev.target.value)}
          placeholder={
            mode === "public"
              ? "Pose une question sur Reims…"
              : "Écris ta question…"
          }
          className="min-h-[44px] flex-1 rounded-yuni-md border border-yuni-slate-200 px-3 py-2 text-sm font-body text-yuni-slate-900 focus:border-yuni-terracotta-500 focus:outline-none focus:ring-2 focus:ring-yuni-terracotta-500/30"
          disabled={!sessionId || !isAuthenticated || chat.isPending}
          autoComplete="off"
        />
        <button
          type="submit"
          className="min-h-[44px] min-w-[44px] rounded-yuni-md bg-yuni-slate-900 px-3 text-white transition-colors hover:bg-yuni-terracotta-700 disabled:opacity-50"
          disabled={
            !sessionId ||
            !isAuthenticated ||
            chat.isPending ||
            !question.trim()
          }
          aria-label="Envoyer la question"
        >
          →
        </button>
      </form>
      {chat.isError ? (
        <p className="mt-2 text-xs text-yuni-terracotta-700" role="alert">
          Impossible d’envoyer le message. Réessaie plus tard.
        </p>
      ) : null}
      {!isAuthenticated ? (
        <p className="mt-3 text-center text-xs text-yuni-slate-400">
          <Link href="/login" className="underline">
            Connecte-toi
          </Link>{" "}
          pour le chat texte et la voix.
        </p>
      ) : null}
    </div>
  );
}
