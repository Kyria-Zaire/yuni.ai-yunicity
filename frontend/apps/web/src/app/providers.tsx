"use client";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { YuniAIClient } from "@yuni/api-client";
import { YuniAIProvider } from "@yuni/api-client/react";
import { AuthProvider, useAuth } from "@yuni/auth";
import { YuniToastProvider } from "@yuni/ui";

const resolvedApiBase =
  process.env.NEXT_PUBLIC_YUNI_API_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:8000"
    : undefined);
if (!resolvedApiBase) {
  throw new Error("NEXT_PUBLIC_YUNI_API_URL must be defined in production");
}
const defaultApiBase: string = resolvedApiBase;

function YuniBridge({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const client = useMemo(
    () =>
      new YuniAIClient({
        baseUrl: defaultApiBase,
        getToken: () => token,
      }),
    [token],
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
