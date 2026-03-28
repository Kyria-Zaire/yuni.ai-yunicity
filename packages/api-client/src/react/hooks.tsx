"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import type {
  ChatRequest,
  LeaderboardPeriod,
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
