import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef, useState, type ReactNode } from "react";

import { YuniAIClient } from "@yuni/api-client";
import { YuniAIProvider } from "@yuni/api-client/react";
import { AuthProvider, useAuth } from "@yuni/auth";

function YuniBridge({ children }: { children: ReactNode }) {
  const { getAccessToken } = useAuth();
  const tokenRef = useRef(getAccessToken);
  tokenRef.current = getAccessToken;
  const [client] = useState(
    () =>
      new YuniAIClient({
        baseUrl:
          process.env.EXPO_PUBLIC_YUNI_API_URL ?? "http://127.0.0.1:8000",
        getToken: () => tokenRef.current(),
      }),
  );
  return <YuniAIProvider client={client}>{children}</YuniAIProvider>;
}

export function MobileProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <YuniBridge>{children}</YuniBridge>
      </AuthProvider>
    </QueryClientProvider>
  );
}
