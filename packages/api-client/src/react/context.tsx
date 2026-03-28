"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import type { YuniAIClient } from "../client";

const YuniClientContext = createContext<YuniAIClient | null>(null);

export function YuniAIProvider({
  client,
  children,
}: {
  client: YuniAIClient;
  children: ReactNode;
}) {
  return (
    <YuniClientContext.Provider value={client}>
      {children}
    </YuniClientContext.Provider>
  );
}

export function useYuniAIClient(): YuniAIClient {
  const client = useContext(YuniClientContext);
  if (!client) {
    throw new Error("useYuniAIClient doit être utilisé sous <YuniAIProvider>");
  }
  return client;
}
