import bundleAnalyzer from "@next/bundle-analyzer";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline",
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.railway\.app\/health/,
      handler: "NetworkFirst",
      options: {
        cacheName: "yuni-api-health",
        expiration: { maxAgeSeconds: 60 },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.railway\.app\/v1\/vitality/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "yuni-vitality",
        expiration: { maxAgeSeconds: 3600 },
      },
    },
  ],
});

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@yuni/ui",
    "@yuni/api-client",
    "@yuni/auth",
    "@yuni/design-tokens",
  ],
};

export default withBundleAnalyzer(withPWA(nextConfig));
