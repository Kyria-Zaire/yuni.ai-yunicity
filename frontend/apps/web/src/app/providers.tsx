"use client";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { YuniAIClient } from "@yuni/api-client";
import { YuniAIProvider } from "@yuni/api-client/react";
import { AuthProvider, useAuth } from "@yuni/auth";
import { YuniToastProvider } from "@yuni/ui";

const defaultApiBase =
  process.env.NEXT_PUBLIC_YUNI_API_URL ?? "http://127.0.0.1:8000";

function YuniBridge({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  /** Toujours lire le JWT courant (évite une course client React Query vs recréation du client). */
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;

  const client = useMemo(
    () =>
      new YuniAIClient({
        baseUrl: defaultApiBase,
        getToken: () => tokenRef.current,
      }),
    [],
  );

  useEffect(() => {
    if (token) {
      void queryClient.invalidateQueries();
    }
  }, [token, queryClient]);

  return <YuniAIProvider client={client}>{children}</YuniAIProvider>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <YuniToastProvider>
          <YuniBridge>{children}</YuniBridge>
        </YuniToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
