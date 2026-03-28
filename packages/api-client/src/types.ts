/** Types alignés sur les schémas Pydantic Yuni AI v2 (FastAPI). */

export interface GeoInput {
  lat_truncated: number;
  lng_truncated: number;
}

/** Acteur carte — aligné sur `app.models.yunicity.Actor`. */
export interface MapActor {
  id: string;
  name: string;
  category: string;
  city: string;
  geo: { lat: number; lng: number };
  description: string;
  tags: string[];
  /** Optionnel — enrichissement sémantique futur */
  semantic_score?: number;
}

/** Réponse `GET /v1/map/data` — alignée sur `MapData` Pydantic. */
export interface MapDataResponse {
  actors: MapActor[];
  tribes: unknown[];
  events: unknown[];
  zone: string;
}

export interface UserInput {
  user_id_hash: string;
  city: string;
  interests: string[];
  points: number;
  geo: GeoInput;
}

export interface ResponseMeta {
  request_id: string;
  timestamp: string;
  source: string;
  latency_ms?: number | null;
}

export interface ActorRecommendation {
  id: string;
  name: string;
  category: string;
  distance_km?: number | null;
  reason: string;
  score: number;
}

export interface TribeRecommendation {
  id: string;
  name: string;
  category: string;
  members_count: number;
  reason: string;
  score: number;
}

export interface EventRecommendation {
  id: string;
  title: string;
  actor_id: string;
  date: string;
  category: string;
  reason: string;
}

export interface RecommendationOutput {
  actors: ActorRecommendation[];
  tribes: TribeRecommendation[];
  events: EventRecommendation[];
  reason: string;
  source:
    | "yuni_ai_cache"
    | "yuni_ai_mistral"
    | "yuni_ai_fallback";
}

export interface RecommendationSuccess {
  data: RecommendationOutput;
  meta: ResponseMeta;
}

export interface NotEligibleResponse {
  eligible: false;
  message: string;
  meta: ResponseMeta;
}

export type RecommendationApiResponse =
  | RecommendationSuccess
  | NotEligibleResponse;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  session_id: string;
  user_id_hash: string;
  city: string;
  message: string;
}

export interface ChatResponse {
  session_id: string;
  message: ChatMessage;
  history_length: number;
  context_used: string[];
}

export interface VitalityDimension {
  name: string;
  score: number;
  weight: number;
  details: Record<string, unknown>;
}

export interface VitalityIndexResponse {
  city: string;
  zone: string;
  score: number;
  grade: string;
  trend: string;
  dimensions: Record<string, unknown>[];
  computed_at: string;
  valid_until: string;
}

export interface VitalityApiEnvelope {
  data: VitalityIndexResponse;
  meta: ResponseMeta;
}

export type QuestDifficulty = "easy" | "medium" | "hard" | "epic";
export type QuestCategory =
  | "exploration"
  | "social"
  | "culture"
  | "sport"
  | "civic"
  | "food"
  | "nature";

export interface QuestStep {
  order: number;
  description: string;
  geo: GeoInput | null;
  actor_id: string | null;
  validation_hint: string;
}

export interface Quest {
  id: string;
  city: string;
  title: string;
  description: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  xp_reward: number;
  estimated_duration: string;
  steps: QuestStep[];
  interests_match: string[];
  expires_at: string;
  created_at: string;
}

export type QuestProgressStatus =
  | "available"
  | "in_progress"
  | "completed"
  | "expired";

export interface UserQuestProgress {
  quest_id: string;
  user_id_hash: string;
  status: QuestProgressStatus;
  current_step: number;
  started_at: string | null;
  completed_at: string | null;
}

export type CitizenLevel =
  | "visiteur"
  | "habitant"
  | "citoyen"
  | "acteur"
  | "ambassadeur";

export interface UserXPProfile {
  user_id_hash: string;
  total_xp: number;
  level: CitizenLevel;
  badges: string[];
  xp_history: Record<string, unknown>[];
  next_level_xp: number;
}

export type ReportCategory =
  | "voirie"
  | "eclairage"
  | "proprete"
  | "securite"
  | "infra"
  | "nature"
  | "autre";

export interface ReportInput {
  city: string;
  description: string;
  geo: GeoInput | null;
  category: ReportCategory | null;
  source: "text" | "voice";
}

export interface ReportOutput {
  report_id: string;
  category: ReportCategory;
  status: "received" | "processing" | "forwarded";
  message: string;
  estimated_response: string;
}

export type ContentType =
  | "post_social"
  | "post_long"
  | "promotion"
  | "newsletter"
  | "story"
  | "sms"
  | "flyer_text";

export interface MerchantContentRequest {
  business_name: string;
  business_type: string;
  city: string;
  content_type: ContentType;
  topic: string;
  tone:
    | "professionnel"
    | "amical"
    | "promotionnel"
    | "informatif"
    | "urgent";
  include_emoji: boolean;
  language: string;
  target_audience: string | null;
}

export interface GeneratedContent {
  content_type: ContentType;
  text: string;
  char_count: number;
  suggestions: string[];
  hashtags: string[];
  best_post_time: string | null;
  generated_at: string;
}

export interface MerchantContentResponse {
  business_name: string;
  contents: GeneratedContent[];
  total_generated: number;
}

export interface OnboardingStep {
  order: number;
  title: string;
  description: string;
  category:
    | "admin"
    | "logement"
    | "sante"
    | "social"
    | "transport"
    | "culture";
  action_url: string | null;
  voice_text: string;
}

export interface OnboardingGuide {
  city: string;
  total_steps: number;
  steps: OnboardingStep[];
  estimated_time_days: number;
  local_contacts: Record<string, unknown>[];
}

export interface HealthServices {
  redis: string;
  qdrant: string;
  mistral: string;
}

export interface HealthMetrics {
  cache_hit_rate: number;
  cache_hits: number;
  cache_misses: number;
  mistral_calls: number;
  mistral_errors: number;
  fallback_calls: number;
  error_rate: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  estimated_cost_eur: number;
  eligible_requests: number;
  not_eligible_requests: number;
  semantic_searches: number;
  semantic_fallbacks: number;
  voice_turns: number;
  stt_calls: number;
  tts_calls: number;
  tts_cache_hits: number;
  xp_awarded: number;
  badges_unlocked: number;
  quests_generated: number;
  quests_completed: number;
  mistral_large_calls: number;
  mistral_small_calls: number;
  semantic_cache_hits: number;
  blackbox_records: number;
  partner_requests: number;
  federation_queries: number;
  rollout_percentage: number;
}

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  timestamp: string;
  services: HealthServices;
  metrics: HealthMetrics;
}

export interface ProblemDetail {
  type?: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

export type LeaderboardPeriod = "week" | "month" | "all_time";

export interface LeaderboardEntry {
  rank: number;
  pseudonym: string;
  level: CitizenLevel;
  total_xp: number;
  badges_count: number;
  is_current_user: boolean;
}

export interface LeaderboardResponse {
  city: string;
  zone: string | null;
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
  current_user_rank: number | null;
  total_participants: number;
  updated_at: string;
}

export interface BadgeCatalogItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  condition: string;
}

export interface DashboardVitalityZone {
  zone: string;
  score: number;
  grade: string;
  trend: string;
  dimensions: Record<string, { score: number; weight: number }>;
}

export interface DashboardVitalityResponse {
  city: string;
  computed_at: string;
  zones: DashboardVitalityZone[];
  city_average: number;
  top_zone: string;
  bottom_zone: string;
}

export interface DashboardEngagementResponse {
  city: string;
  period: string;
  metrics: {
    recommendations_served: number;
    cache_hit_rate: number;
    rollout_percentage: number;
    mistral_calls: number;
    estimated_cost_eur: number;
  };
}

export interface DashboardActorRow {
  id: string;
  name: string;
  category: string;
  recommendation_count: number;
}

export interface DashboardActorsResponse {
  city: string;
  actors: DashboardActorRow[];
}

export interface AdminOverviewResponse {
  timestamp: string;
  version: string;
  environment: string;
  cities: { total: number; active: number; rollout: Record<string, number> };
  metrics: {
    cache_hit_rate: number;
    p95_latency_ms: number;
    error_rate: number;
    mistral_large_calls: number;
    mistral_small_calls: number;
  };
  budget: {
    estimated_cost_eur: number;
    routing_savings_pct: number;
  };
  users: {
    total_eligible: number;
    total_xp_awarded: number;
    badges_unlocked: number;
    quests_completed: number;
  };
}

/** GET /v1/sentiment/{city} — zones agrégées. */
export type SentimentScoreLabel =
  | "tres_positif"
  | "positif"
  | "neutre"
  | "negatif"
  | "tres_negatif";

export interface ZoneSentiment {
  city: string;
  zone: string;
  mood_score: number;
  sentiment: SentimentScoreLabel;
  trend: "improving" | "stable" | "degrading";
  top_topics: string[];
  sample_count: number;
  computed_at: string;
  valid_until: string;
}

export interface CityPeer {
  city_id: string;
  display_name: string;
  country: string;
  population_range: string;
  vitality_score_avg: number;
  joined_federation_at: string;
  export_url: string | null;
}

export interface FederationStats {
  total_cities: number;
  countries: string[];
  avg_vitality_score: number;
  top_performing_city: string;
  benchmark_data: Record<string, number>;
}

export interface FederationCompareResponse {
  city_score: number;
  peer_average: number;
  percentile: number;
  delta: number;
  ranking: number;
}

export type BudgetStatus = "ok" | "warning" | "critical" | "emergency";

export interface DailyBudgetStats {
  date: string;
  mistral_large_cost_eur: number;
  mistral_small_cost_eur: number;
  total_cost_eur: number;
  calls_large: number;
  calls_small: number;
  savings_vs_all_large_eur: number;
  cache_hit_rate: number;
}

export interface MonthlyBudgetReport {
  month: string;
  budget_eur: number;
  spent_eur: number;
  remaining_eur: number;
  spent_pct: number;
  status: BudgetStatus;
  daily_breakdown: DailyBudgetStats[];
  projection_month_end_eur: number;
  top_cost_by_city: Record<string, number>;
  top_cost_by_task: Record<string, number>;
}

export type AIDecisionTypeApi =
  | "recommendation"
  | "vitality_score"
  | "sentiment"
  | "quest_generation"
  | "agent_action"
  | "chat_response"
  | "content_generation";

export interface AIDecisionRecord {
  record_id: string;
  timestamp: string;
  decision_type: AIDecisionTypeApi;
  model_used: string;
  source: string;
  city: string;
  zone: string | null;
  latency_ms: number;
  decision_summary: string;
  confidence: number;
  checksum: string;
  previous_record_id: string | null;
}

export interface AuditChain {
  city: string;
  records_count: number;
  chain_valid: boolean;
  oldest_record: string;
  newest_record: string;
  integrity_hash: string;
}

export interface AuditVerifyResponse {
  city: string;
  chain_valid: boolean;
  records_count: number;
  integrity_hash: string;
}

/** GET /v1/cities — registre public. */
export interface RegistryCityConfig {
  city_id: string;
  display_name: string;
  country: string;
  language: string;
  center_lat: number;
  center_lng: number;
  zones: string[];
  radius_km: number;
  yunicity_api_url: string;
  yunicity_service_token_key: string;
  mistral_context: string;
  features: Record<string, boolean>;
  rollout_percentage: number;
  active: boolean;
  onboarding_steps: string[];
  local_contacts: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export interface CityListResponse {
  cities: RegistryCityConfig[];
  total: number;
}

/** Export civique ODbL — sous-ensemble pour le front. */
export interface CivicDataExport {
  export_id: string;
  generated_at: string;
  license: string;
  license_url: string;
  source: string;
  city: string;
  period_start: string;
  period_end: string;
  data_version: string;
}

export interface DashboardVitalityExportJson {
  city: string;
  exported_at: string;
  request_id: string;
  zones: { zone: string; score: number; grade: string; trend: string }[];
}
