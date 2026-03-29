"use client";

import { useState } from "react";

import { useChatMutation } from "@yuni/api-client/react";
import { useAuth } from "@yuni/auth";

export function HeyYuniPanel({ city }: { city: string }) {
  const { user, isAuthenticated } = useAuth();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [question, setQuestion] = useState("");
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const chat = useChatMutation();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = question.trim();
    if (!isAuthenticated || !user?.hash || !msg) {
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
    <div className="mt-6 rounded-yuni-lg border border-yuni-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yuni-terracotta-500">
            <span className="text-xs font-bold text-white">Y</span>
          </div>
          <h3 className="font-display text-base font-bold text-yuni-slate-900">
            Hey Yuni
          </h3>
        </div>
      </div>
      {lastResponse ? (
        <p className="mb-3 line-clamp-3 text-sm text-yuni-slate-600">
          {lastResponse}
        </p>
      ) : (
        <p className="mb-3 text-sm text-yuni-slate-500">
          Pose une question sur ta ville — réponse via l’API Yuni.
        </p>
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
          placeholder="Posez une question…"
          className="min-h-[44px] flex-1 rounded-yuni-md border border-yuni-slate-200 px-3 py-2 text-sm font-body text-yuni-slate-900 focus:border-yuni-terracotta-500 focus:outline-none focus:ring-2 focus:ring-yuni-terracotta-500/30"
          disabled={!isAuthenticated || chat.isPending}
          autoComplete="off"
        />
        <button
          type="submit"
          className="min-h-[44px] min-w-[44px] rounded-yuni-md bg-yuni-slate-900 px-3 text-white transition-colors hover:bg-yuni-terracotta-600 disabled:opacity-50"
          disabled={!isAuthenticated || chat.isPending || !question.trim()}
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
      <p className="mt-3 text-center text-xs text-yuni-slate-400">
        La voix est disponible dans le bandeau principal (Hey Yuni).
      </p>
    </div>
  );
}
