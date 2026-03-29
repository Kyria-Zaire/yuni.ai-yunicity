import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="font-editorial text-3xl text-yuni-slate-900">
        Bienvenue
      </h1>
      <p className="mt-4 text-yuni-slate-600">
        Le parcours d’onboarding complet arrive au sprint FE-2. En attendant,
        connecte-toi pour tester l’API.
      </p>
      <Link href="/login" className="mt-8 inline-block text-yuni-slate-500 underline">
        Aller à la connexion
      </Link>
    </div>
  );
}
