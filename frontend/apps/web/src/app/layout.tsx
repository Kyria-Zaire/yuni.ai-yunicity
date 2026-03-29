import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import {
  Cormorant_Garamond,
  JetBrains_Mono,
  Outfit,
} from "next/font/google";

import { AxeInit } from "@/components/dev/AxeInit";
import { SiteHeader } from "@/components/layout/SiteHeader";

import "./globals.css";
import { Providers } from "./providers";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-editorial",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Yuni AI — Ton assistant territorial",
  description:
    "L'IA qui connaît ta ville. Recommandations, vitalité, quêtes citoyennes.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Yuni AI",
    description: "La présence vivante de ta ville.",
  },
};

export const viewport: Viewport = {
  themeColor: "#C1440E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${cormorant.variable} ${outfit.variable} ${mono.variable}`}
    >
      <body className="min-h-screen font-body antialiased">
        <AxeInit />
        <Providers>
          <SiteHeader />
          <main id="main-content">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
