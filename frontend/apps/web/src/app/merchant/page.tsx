"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMerchantGenerateMutation } from "@yuni/api-client/react";
import { YuniAPIError, type ContentType, type MerchantContentRequest } from "@yuni/api-client";
import { useAuth } from "@yuni/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DEFAULT_CITY } from "@/lib/constants";

const CONTENT_OPTIONS: { value: ContentType; label: string; hint: string }[] =
  [
    {
      value: "post_social",
      label: "📱 Post réseaux sociaux",
      hint: "280 caractères",
    },
    {
      value: "post_long",
      label: "📰 Article / post long",
      hint: "texte long",
    },
    { value: "promotion", label: "🎁 Offre promotionnelle", hint: "CTA" },
    { value: "newsletter", label: "📧 Newsletter email", hint: "email" },
    {
      value: "story",
      label: "📸 Story Instagram/Facebook",
      hint: "vertical",
    },
    { value: "sms", label: "💬 SMS promotionnel", hint: "160 caractères" },
    { value: "flyer_text", label: "🖨️ Texte flyer", hint: "print" },
  ];

const schema = z.object({
  businessName: z.string().min(2).max(200),
  businessType: z.string().min(2).max(100),
  contentType: z.enum([
    "post_social",
    "post_long",
    "promotion",
    "newsletter",
    "story",
    "sms",
    "flyer_text",
  ]),
  topic: z.string().min(5).max(500),
  tone: z.enum([
    "professionnel",
    "amical",
    "promotionnel",
    "informatif",
    "urgent",
  ]),
  includeEmoji: z.boolean(),
  targetAudience: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof schema>;

type HistoryEntry = {
  id: string;
  type: ContentType;
  at: string;
  preview: string;
  payload: MerchantContentRequest;
};

const TEMPLATES: {
  id: string;
  label: string;
  topic: string;
  tone: FormValues["tone"];
}[] = [
  {
    id: "soldes",
    label: "☀️ Soldes",
    topic: "Annonce des soldes d’été : remises jusqu’à -50% sur une sélection.",
    tone: "promotionnel",
  },
  {
    id: "nouveau",
    label: "🆕 Nouveau produit",
    topic: "Lancement d’un nouveau produit signature, disponible dès cette semaine.",
    tone: "professionnel",
  },
  {
    id: "event",
    label: "🎉 Événement",
    topic: "Soirée découverte vendredi : dégustation et rencontre avec le producteur.",
    tone: "amical",
  },
  {
    id: "fermeture",
    label: "⚠️ Fermeture exceptionnelle",
    topic: "Fermeture exceptionnelle lundi pour inventaire — réouverture mardi 9h.",
    tone: "informatif",
  },
];

export default function MerchantPage() {
  const { user } = useAuth();
  const mut = useMerchantGenerateMutation();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: "Mon commerce",
      businessType: "Commerce de proximité",
      contentType: "post_social",
      topic: "Décrivez votre offre ou actualité…",
      tone: "amical",
      includeEmoji: true,
      targetAudience: "",
    },
  });

  useEffect(() => {
    const name = user?.email?.split("@")[0];
    if (name) {
      form.setValue("businessName", name);
    }
  }, [user, form]);

  const onSubmit = form.handleSubmit((values) => {
    const body: MerchantContentRequest = {
      business_name: values.businessName,
      business_type: values.businessType,
      city: DEFAULT_CITY,
      content_type: values.contentType,
      topic: values.topic,
      tone: values.tone,
      include_emoji: values.includeEmoji,
      language: "fr",
      target_audience: values.targetAudience?.trim()
        ? values.targetAudience.trim()
        : null,
    };
    mut.mutate(body, {
      onSuccess: (res) => {
        const main = res.contents[0];
        if (main) {
          const entry: HistoryEntry = {
            id: `${Date.now()}`,
            type: main.content_type,
            at: new Date().toISOString(),
            preview: main.text.slice(0, 50),
            payload: body,
          };
          setHistory((h) => [entry, ...h].slice(0, 5));
        }
      },
    });
  });

  const applyTemplate = useCallback(
    (t: (typeof TEMPLATES)[number]) => {
      form.setValue("topic", t.topic);
      form.setValue("tone", t.tone);
    },
    [form],
  );

  const regenerate = useCallback(
    (h: HistoryEntry) => {
      form.reset({
        businessName: h.payload.business_name,
        businessType: h.payload.business_type,
        contentType: h.payload.content_type,
        topic: h.payload.topic,
        tone: h.payload.tone,
        includeEmoji: h.payload.include_emoji,
        targetAudience: h.payload.target_audience ?? "",
      });
    },
    [form],
  );

  const contents = useMemo(
    () => mut.data?.contents ?? [],
    [mut.data?.contents],
  );
  const primary = contents[0];
  const [editedText, setEditedText] = useState("");

  useEffect(() => {
    if (primary) {
      setEditedText(primary.text);
    }
  }, [primary]);

  const charCount = editedText.length;
  const smsOver = primary?.content_type === "sms" && charCount > 160;

  const suggestions = useMemo(() => contents.slice(1, 4), [contents]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="font-editorial text-3xl text-yuni-slate-900">
          Studio commerçant
        </h1>
        <p className="text-sm text-yuni-slate-600">
          Génération de contenus — Yuni AI
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t)}
                className="rounded-yuni-md border border-yuni-wheat-200 bg-white px-3 py-1.5 text-xs font-medium text-yuni-slate-800 shadow-yuni-sm hover:border-yuni-terracotta-300"
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4 rounded-yuni-lg border border-yuni-wheat-100 bg-white p-6 shadow-yuni-sm">
            <label className="block space-y-1 text-sm">
              <span className="text-yuni-slate-600">Nom du commerce</span>
              <input
                className="w-full rounded-yuni-md border border-yuni-wheat-200 px-3 py-2"
                {...form.register("businessName")}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-yuni-slate-600">Type</span>
              <input
                className="w-full rounded-yuni-md border border-yuni-wheat-200 px-3 py-2"
                {...form.register("businessType")}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-yuni-slate-600">Type de contenu</span>
              <select
                className="w-full rounded-yuni-md border border-yuni-wheat-200 px-3 py-2"
                {...form.register("contentType")}
              >
                {CONTENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} — {o.hint}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-yuni-slate-600">Sujet</span>
              <textarea
                rows={4}
                className="w-full rounded-yuni-md border border-yuni-wheat-200 px-3 py-2"
                placeholder="Décrivez votre offre ou actualité…"
                {...form.register("topic")}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-yuni-slate-600">Ton</span>
              <select
                className="w-full rounded-yuni-md border border-yuni-wheat-200 px-3 py-2"
                {...form.register("tone")}
              >
                <option value="professionnel">🧑‍💼 professionnel</option>
                <option value="amical">😊 amical</option>
                <option value="promotionnel">🔥 promotionnel</option>
                <option value="informatif">ℹ️ informatif</option>
                <option value="urgent">⚡ urgent</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register("includeEmoji")} />
              Inclure des émojis
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-yuni-slate-600">Public cible (optionnel)</span>
              <input
                className="w-full rounded-yuni-md border border-yuni-wheat-200 px-3 py-2"
                {...form.register("targetAudience")}
              />
            </label>
            <button
              type="submit"
              disabled={mut.isPending}
              className="w-full rounded-yuni-md bg-yuni-terracotta-500 py-3 text-sm font-semibold text-white hover:bg-yuni-terracotta-600 disabled:opacity-50"
            >
              {mut.isPending ? "Génération…" : "Générer avec Yuni AI"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {primary ? (
            <div className="rounded-yuni-lg border border-yuni-wheat-100 bg-white p-6 shadow-yuni-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="rounded-yuni-sm bg-yuni-wheat-100 px-2 py-0.5 text-xs font-medium text-yuni-slate-700">
                  Généré par Yuni AI
                </span>
                <button
                  type="button"
                  onClick={() =>
                    void navigator.clipboard.writeText(editedText)
                  }
                  className="text-sm text-yuni-terracotta-600 hover:underline"
                >
                  Copier
                </button>
              </div>
              <textarea
                className="mt-2 w-full rounded-yuni-md border border-yuni-wheat-200 px-3 py-2 text-sm"
                rows={8}
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
              />
              <p
                className={`mt-1 text-right text-xs ${smsOver ? "text-red-600" : "text-yuni-slate-500"}`}
              >
                {charCount} caractères
              </p>
              {primary.best_post_time ? (
                <p className="mt-3 text-sm text-yuni-slate-700">
                  📅 {primary.best_post_time}
                </p>
              ) : (
                <p className="mt-3 text-sm text-yuni-slate-700">
                  📅 Mardi 18h-20h recommandé pour ce type de contenu
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-yuni-slate-600">
              Le résultat apparaîtra ici après génération.
            </p>
          )}

          {suggestions.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium text-yuni-slate-800">
                Variantes
              </p>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-yuni-md border border-yuni-wheat-100 bg-yuni-wheat-50/80 p-3 text-sm"
                  >
                    <p className="line-clamp-3 text-yuni-slate-800">{s.text}</p>
                    <button
                      type="button"
                      className="mt-2 text-xs text-yuni-terracotta-600 hover:underline"
                      onClick={() =>
                        void navigator.clipboard.writeText(s.text)
                      }
                    >
                      Utiliser cette variante
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {primary?.hashtags?.length ? (
            <div>
              <p className="mb-2 text-sm font-medium text-yuni-slate-800">
                Hashtags
              </p>
              <div className="flex flex-wrap gap-2">
                {primary.hashtags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      void navigator.clipboard.writeText(
                        tag.startsWith("#") ? tag : `#${tag}`,
                      )
                    }
                    className="rounded-yuni-full bg-yuni-slate-100 px-3 py-1 text-xs text-yuni-slate-700 hover:bg-yuni-slate-200"
                  >
                    #{tag.replace(/^#/, "")}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {mut.isError ? (
            <p className="text-sm text-yuni-terracotta-700">
              {mut.error instanceof YuniAPIError && mut.error.status === 401
                ? "Connecte-toi ou renouvelle ta session pour générer du contenu."
                : "Erreur API — vérifie la connexion et le backend."}
            </p>
          ) : null}
        </div>
      </div>

      <section className="mt-12 border-t border-yuni-wheat-200 pt-8">
        <h2 className="mb-4 font-editorial text-xl text-yuni-slate-900">
          Historique (5 dernières)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {history.map((h) => (
            <div
              key={h.id}
              className="rounded-yuni-md border border-yuni-wheat-100 bg-white p-4 text-sm shadow-yuni-sm"
            >
              <p className="text-xs text-yuni-slate-500">
                {h.type} —{" "}
                {new Date(h.at).toLocaleString("fr-FR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
              <p className="mt-1 text-yuni-slate-800">{h.preview}…</p>
              <button
                type="button"
                className="mt-2 text-xs text-yuni-terracotta-600 hover:underline"
                onClick={() => regenerate(h)}
              >
                Régénérer
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
