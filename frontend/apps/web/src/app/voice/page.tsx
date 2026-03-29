"use client";

import Link from "next/link";

import { HeyYuniWeb } from "@/components/voice/HeyYuniWeb";
import { DEFAULT_CITY } from "@/lib/constants";

export default function VoicePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/"
        className="text-sm font-medium text-yuni-terracotta-600 hover:underline"
      >
        ← Retour à l’accueil
      </Link>
      <h1 className="mt-6 font-display text-3xl font-bold text-yuni-slate-900">
        Hey Yuni · Voix
      </h1>
      <p className="mt-2 text-sm text-yuni-slate-600">
        Conversation vocale avec l’assistant territorial.
      </p>
      <div className="mt-8">
        <HeyYuniWeb city={DEFAULT_CITY} />
      </div>
    </div>
  );
}
