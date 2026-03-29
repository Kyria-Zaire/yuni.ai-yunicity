import Link from "next/link";

const STEPS = [
  {
    icon: "🗺️",
    title: "Choisis ton quartier",
    desc: "Centre · Clairmarais · Croix-Rouge…",
  },
  {
    icon: "🎯",
    title: "Tes intérêts",
    desc: "Sport · Culture · Nature · Tech…",
  },
  {
    icon: "🎤",
    title: "Hey Yuni t'attend",
    desc: "Parle à ton assistant territorial",
  },
  {
    icon: "🏆",
    title: "Lance-toi",
    desc: "Première quête · Premier XP",
  },
] as const;

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-yuni-wheat-50 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-bold text-yuni-slate-900">
            Bienvenue à Reims
          </h1>
          <p className="mt-2 text-yuni-slate-600">
            Yuni AI va personnaliser ta ville pour toi
          </p>
        </div>

        <div className="mb-8 space-y-4">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="flex items-center gap-4 rounded-yuni-lg border border-yuni-wheat-300 bg-white p-4"
            >
              <span className="text-3xl" aria-hidden>
                {step.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-body font-semibold text-yuni-slate-900">
                  {step.title}
                </p>
                <p className="text-sm text-yuni-slate-500">{step.desc}</p>
              </div>
              <span className="shrink-0 font-display font-bold text-yuni-terracotta-500">
                {i + 1}
              </span>
            </div>
          ))}
        </div>

        <Link
          href="/login"
          className="block w-full rounded-yuni-sm bg-yuni-terracotta-500 py-4 text-center font-body font-semibold text-white transition-colors hover:bg-yuni-terracotta-700"
        >
          Commencer l&apos;aventure →
        </Link>
      </div>
    </div>
  );
}
