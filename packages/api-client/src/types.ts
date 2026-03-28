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
