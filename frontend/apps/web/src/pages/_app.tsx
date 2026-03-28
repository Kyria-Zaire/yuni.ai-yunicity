import type { AppProps } from "next/app";

/**
 * Couche Pages minimale pour les artefacts statiques /404 et /500 générés par Next.
 * L’app principale reste en App Router (`src/app`).
 */
export default function PagesApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
