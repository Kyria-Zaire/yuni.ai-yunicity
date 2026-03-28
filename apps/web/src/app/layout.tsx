import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import {
  Cormorant_Garamond,
  JetBrains_Mono,
  Outfit,
} from "next/font/google";

import { SiteHeader } from "@/components/layout/SiteHeader";

import "./globals.css";
import { Providers } from "./providers";

const editorial = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-editorial",
  display: "swap",
  weight: ["400", "600", "700"],
});

const body = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Yuni AI",
    description: "La présence vivante de ta ville.",
  },
};

export const viewport: Viewport = {
  themeColor: "#C1440E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${editorial.variable} ${body.variable} ${mono.variable} min-h-screen font-body antialiased`}
      >
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
