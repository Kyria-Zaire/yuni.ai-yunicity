import { YuniAPIError } from "./errors";
import type {
  AdminOverviewResponse,
  BadgeCatalogItem,
  ChatRequest,
  ChatResponse,
  DashboardActorsResponse,
  DashboardEngagementResponse,
  DashboardVitalityResponse,
  HealthResponse,
  LeaderboardPeriod,
  LeaderboardResponse,
  MapDataResponse,
  MerchantContentRequest,
  MerchantContentResponse,
  OnboardingGuide,
  Quest,
  RecommendationApiResponse,
  ReportInput,
  ReportOutput,
  UserInput,
  UserQuestProgress,
  UserXPProfile,
  VitalityApiEnvelope,
} from "./types";

export interface YuniAIClientConfig {
  baseUrl: string;
  getToken: () => string | null;
}

export class YuniAIClient {
  private readonly baseUrl: string;
  private readonly getToken: () => string | null;

  constructor(config: YuniAIClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.getToken = config.getToken;
  }

  private async fetchJson<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    };
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });
    if (!response.ok) {
      const errorBody: unknown = await response.json().catch(() => ({}));
      throw new YuniAPIError(response.status, errorBody);
    }
    return response.json() as Promise<T>;
  }

  private async fetchJsonAdmin<T>(
    path: string,
    adminToken: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-Admin-Token": adminToken,
      ...(options.headers ?? {}),
    };
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });
    if (!response.ok) {
      const errorBody: unknown = await response.json().catch(() => ({}));
      throw new YuniAPIError(response.status, errorBody);
    }
    return response.json() as Promise<T>;
  }

  async getHealth(): Promise<HealthResponse> {
    return this.fetchJson<HealthResponse>("/health");
  }

  async getRecommendations(
    input: UserInput,
  ): Promise<RecommendationApiResponse> {
    return this.fetchJson<RecommendationApiResponse>("/v1/recommend/engagement", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async sendChatMessage(body: ChatRequest): Promise<ChatResponse> {
    return this.fetchJson<ChatResponse>("/v1/chat", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    await this.fetchJson<unknown>(`/v1/chat/${sessionId}`, {
      method: "DELETE",
    });
  }

  async getMapData(city: string): Promise<MapDataResponse> {
    const c = encodeURIComponent(city);
    return this.fetchJson<MapDataResponse>(`/v1/map/data?city=${c}`);
  }

  async getVitality(city: string, zone: string): Promise<VitalityApiEnvelope> {
    const c = encodeURIComponent(city);
    const z = encodeURIComponent(zone);
    return this.fetchJson<VitalityApiEnvelope>(`/v1/vitality/${c}/${z}`);
  }

  async getQuests(
    city: string,
    params?: { interests?: string },
  ): Promise<Quest[]> {
    const c = encodeURIComponent(city);
    const search = new URLSearchParams();
    if (params?.interests) {
      search.set("interests", params.interests);
    }
    const q = search.toString();
    return this.fetchJson<Quest[]>(
      `/v1/quests/${c}${q ? `?${q}` : ""}`,
    );
  }

  async startQuest(city: string, questId: string): Promise<UserQuestProgress> {
    const c = encodeURIComponent(city);
    const q = encodeURIComponent(questId);
    return this.fetchJson<UserQuestProgress>(
      `/v1/quests/${c}/${q}/start`,
      { method: "POST" },
    );
  }

  async getXPProfile(): Promise<UserXPProfile> {
    return this.fetchJson<UserXPProfile>("/v1/gamification/profile");
  }

  async listBadgesCatalog(): Promise<BadgeCatalogItem[]> {
    return this.fetchJson<BadgeCatalogItem[]>("/v1/gamification/badges");
  }

  async getLeaderboard(
    city: string,
    period: LeaderboardPeriod = "week",
  ): Promise<LeaderboardResponse> {
    const c = encodeURIComponent(city);
    return this.fetchJson<LeaderboardResponse>(
      `/v1/leaderboard/${c}?period=${period}`,
    );
  }

  async getDashboardVitality(city: string): Promise<DashboardVitalityResponse> {
    const c = encodeURIComponent(city);
    return this.fetchJson<DashboardVitalityResponse>(
      `/v1/dashboard/${c}/vitality`,
    );
  }

  async getDashboardEngagement(
    city: string,
  ): Promise<DashboardEngagementResponse> {
    const c = encodeURIComponent(city);
    return this.fetchJson<DashboardEngagementResponse>(
      `/v1/dashboard/${c}/engagement`,
    );
  }

  async getDashboardActors(city: string): Promise<DashboardActorsResponse> {
    const c = encodeURIComponent(city);
    return this.fetchJson<DashboardActorsResponse>(
      `/v1/dashboard/${c}/actors`,
    );
  }

  async getAdminOverview(adminToken: string): Promise<AdminOverviewResponse> {
    return this.fetchJsonAdmin<AdminOverviewResponse>(
      "/v1/admin/overview",
      adminToken,
    );
  }

  async patchCityRollout(
    adminToken: string,
    cityId: string,
    percentage: number,
  ): Promise<{ city_id: string; rollout_percentage: number }> {
    return this.fetchJsonAdmin<{ city_id: string; rollout_percentage: number }>(
      `/v1/admin/cities/${encodeURIComponent(cityId)}/rollout`,
      adminToken,
      {
        method: "PATCH",
        body: JSON.stringify({ percentage }),
      },
    );
  }

  async flushCityCache(
    adminToken: string,
    city: string,
  ): Promise<{ status: string; city: string }> {
    return this.fetchJsonAdmin<{ status: string; city: string }>(
      `/v1/admin/cache/flush/${encodeURIComponent(city)}`,
      adminToken,
      { method: "POST" },
    );
  }

  async getQuestProgress(
    city: string,
    questId: string,
  ): Promise<UserQuestProgress | null> {
    const c = encodeURIComponent(city);
    const q = encodeURIComponent(questId);
    return this.fetchJson<UserQuestProgress | null>(
      `/v1/quests/${c}/${q}/progress`,
    );
  }

  async completeQuestStep(
    city: string,
    questId: string,
    step: number,
  ): Promise<UserQuestProgress> {
    const c = encodeURIComponent(city);
    const q = encodeURIComponent(questId);
    return this.fetchJson<UserQuestProgress>(
      `/v1/quests/${c}/${q}/step/${step}`,
      { method: "POST" },
    );
  }

  async createReport(report: ReportInput): Promise<ReportOutput> {
    return this.fetchJson<ReportOutput>("/v1/reports", {
      method: "POST",
      body: JSON.stringify(report),
    });
  }

  async generateMerchantContent(
    request: MerchantContentRequest,
  ): Promise<MerchantContentResponse> {
    return this.fetchJson<MerchantContentResponse>("/v1/merchant/generate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getOnboardingGuide(city: string): Promise<OnboardingGuide> {
    const c = encodeURIComponent(city);
    return this.fetchJson<OnboardingGuide>(`/v1/onboarding/${c}`);
  }

  /**
   * WebSocket voix — aligné sur `GET /ws/voice/{session_id}?token=&city=`.
   */
  createVoiceSession(sessionId: string, token: string, city: string): WebSocket {
    const base = this.baseUrl;
    const wsBase = base.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
    const params = new URLSearchParams({
      token,
      city,
    });
    return new WebSocket(`${wsBase}/ws/voice/${sessionId}?${params.toString()}`);
  }
}
