"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import type {
  ChatRequest,
  LeaderboardPeriod,
  MerchantContentRequest,
  RegistryCityConfig,
  ReportInput,
  UserInput,
} from "../types";
import { useYuniAIClient } from "./context";

export function useRecommendations(input: UserInput, enabled = true) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["recommendations", input],
    queryFn: () => client.getRecommendations(input),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useVitality(city: string, zone: string, enabled = true) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["vitality", city, zone],
    queryFn: () => client.getVitality(city, zone),
    enabled: Boolean(city && zone) && enabled,
    staleTime: 1000 * 60 * 60,
  });
}

export function useXPProfile(enabled = true) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["xp-profile"],
    queryFn: () => client.getXPProfile(),
    enabled,
  });
}

export function useQuests(city: string, interests?: string, enabled = true) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["quests", city, interests ?? ""],
    queryFn: () => client.getQuests(city, { interests }),
    enabled: Boolean(city) && enabled,
    staleTime: 1000 * 60 * 10,
  });
}

export function useChatMutation() {
  const client = useYuniAIClient();
  return useMutation({
    mutationFn: (body: ChatRequest) => client.sendChatMessage(body),
  });
}

export function useHealth(enabled = true) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["health"],
    queryFn: () => client.getHealth(),
    enabled,
    staleTime: 30_000,
  });
}

export function useReportMutation() {
  const client = useYuniAIClient();
  return useMutation({
    mutationFn: (body: ReportInput) => client.createReport(body),
  });
}

/** Alias produit (FE-014) — identique à `useReportMutation`. */
export function useCreateReport() {
  return useReportMutation();
}

export function useActors(city: string, enabled = true) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["actors", city],
    queryFn: () => client.getMapData(city),
    enabled: Boolean(city) && enabled,
    staleTime: 1000 * 60 * 10,
  });
}

export function useLeaderboard(city: string, period: LeaderboardPeriod, enabled = true) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["leaderboard", city, period],
    queryFn: () => client.getLeaderboard(city, period),
    enabled: Boolean(city) && enabled,
    staleTime: 60_000,
  });
}

export function useBadgesCatalog() {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["badges-catalog"],
    queryFn: () => client.listBadgesCatalog(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useDashboardVitality(city: string, enabled = true) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["dashboard-vitality", city],
    queryFn: () => client.getDashboardVitality(city),
    enabled: Boolean(city) && enabled,
  });
}

export function useDashboardEngagement(city: string, enabled = true) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["dashboard-engagement", city],
    queryFn: () => client.getDashboardEngagement(city),
    enabled: Boolean(city) && enabled,
  });
}

export function useDashboardActors(city: string, enabled = true) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["dashboard-actors", city],
    queryFn: () => client.getDashboardActors(city),
    enabled: Boolean(city) && enabled,
  });
}

export function useSentimentCity(city: string, enabled = true) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["sentiment-city", city],
    queryFn: () => client.getSentimentCity(city),
    enabled: Boolean(city) && enabled,
    staleTime: 60_000,
  });
}

export function useFederationStats(enabled = true) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["federation-stats"],
    queryFn: () => client.getFederationStats(),
    enabled,
    staleTime: 120_000,
  });
}

export function useFederationPeers(cityId: string, enabled = true) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["federation-peers", cityId],
    queryFn: () => client.getFederationPeers(cityId),
    enabled: Boolean(cityId) && enabled,
    staleTime: 120_000,
  });
}

export function useFederationCompare(
  cityId: string,
  myScore: number | undefined,
  enabled = true,
) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["federation-compare", cityId, myScore ?? null],
    queryFn: () => client.getFederationCompare(cityId, myScore),
    enabled: Boolean(cityId) && myScore != null && enabled,
    staleTime: 120_000,
  });
}

export function useCivicExport(
  city: string,
  periodDays: number,
  enabled = false,
) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["civic-export", city, periodDays],
    queryFn: () => client.getCivicExport(city, periodDays),
    enabled: Boolean(city) && enabled,
  });
}

export function useCities(enabled = true) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["cities-registry"],
    queryFn: () => client.getCities(),
    enabled,
    staleTime: 60_000,
  });
}

export function useAdminOverview(adminToken: string | null, enabled = true) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["admin-overview", adminToken ?? ""],
    queryFn: () => client.getAdminOverview(adminToken as string),
    enabled: Boolean(adminToken) && enabled,
    staleTime: 30_000,
  });
}

export function useBudgetMonthly(adminToken: string | null, enabled = true) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["admin-budget-monthly", adminToken ?? ""],
    queryFn: () => client.getBudgetMonthly(adminToken as string),
    enabled: Boolean(adminToken) && enabled,
    staleTime: 60_000,
  });
}

export function useAuditChain(city: string, enabled = true) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["audit-chain", city],
    queryFn: () => client.getAuditChain(city),
    enabled: Boolean(city) && enabled,
  });
}

export function useAuditRecords(
  city: string,
  limit: number,
  enabled = true,
) {
  const client = useYuniAIClient();
  return useQuery({
    queryKey: ["audit-records", city, limit],
    queryFn: () => client.getAuditRecords(city, limit),
    enabled: Boolean(city) && enabled,
    staleTime: 15_000,
  });
}

export function useExportDashboardMutation() {
  const client = useYuniAIClient();
  return useMutation({
    mutationFn: ({
      city,
      format,
    }: {
      city: string;
      format: "json" | "csv";
    }) => client.exportDashboard(city, format),
  });
}

export function useVerifyAuditMutation() {
  const client = useYuniAIClient();
  return useMutation({
    mutationFn: ({
      adminToken,
      city,
    }: {
      adminToken: string;
      city: string;
    }) => client.verifyAuditChain(adminToken, city),
  });
}

export function useRegisterCityMutation() {
  const client = useYuniAIClient();
  return useMutation({
    mutationFn: ({
      adminToken,
      body,
    }: {
      adminToken: string;
      body: RegistryCityConfig;
    }) => client.registerCity(adminToken, body),
  });
}

export function usePatchCityRolloutMutation() {
  const client = useYuniAIClient();
  return useMutation({
    mutationFn: ({
      adminToken,
      cityId,
      percentage,
    }: {
      adminToken: string;
      cityId: string;
      percentage: number;
    }) => client.patchCityRollout(adminToken, cityId, percentage),
  });
}

export function useFlushCityCacheMutation() {
  const client = useYuniAIClient();
  return useMutation({
    mutationFn: ({
      adminToken,
      city,
    }: {
      adminToken: string;
      city: string;
    }) => client.flushCityCache(adminToken, city),
  });
}

export function useMerchantGenerateMutation() {
  const client = useYuniAIClient();
  return useMutation({
    mutationFn: (body: MerchantContentRequest) =>
      client.generateMerchantContent(body),
  });
}
