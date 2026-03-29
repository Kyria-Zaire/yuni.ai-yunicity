import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Gelasio, JetBrains_Mono, Outfit, Space_Mono } from "next/font/google";

import { AxeInit } from "@/components/dev/AxeInit";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

import "./globals.css";
import { Providers } from "./providers";

const gelasio = Gelasio({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

const neuroMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-neuro-mono",
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Yuni.ai — Ta ville, en direct.",
  description:
    "Média territorial souverain : recommandations, vitalité, voix et quêtes citoyennes.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Yuni.ai",
    description: "Ta ville, en direct.",
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
      className={`${gelasio.variable} ${outfit.variable} ${mono.variable} ${neuroMono.variable}`}
    >
      <body className="min-h-screen font-body antialiased">
        <AxeInit />
        <Providers>
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
