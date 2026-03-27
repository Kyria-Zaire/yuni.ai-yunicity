# Changelog — Yuni AI

## [2.0.0] - 2026-11-XX

### Added (Sprint 8)
- Civic Blackbox: immutable AI decision audit trail (EU AI Act compliant)
- EU Federation: city peer comparison FR/BE/DE with ODBL sharing
- Predictive analytics: 7-day urban flow forecast per zone
- Partner SDK: API keys + 4 tiers + sandbox + hourly rate limiting
- Funding dossier: PIIEC/Bpifrance technical documentation
- Load testing: k6 1000 VUs stress test script
- Fire-and-forget blackbox recording in recommend, chat, vitality routers
- EU AI Act transparency notice published

---

## [1.4.0] - 2026-10-XX

### Added (Sprint 7)
- Mistral routing: Large vs Small (cost ÷3)
- Semantic cache v2: Qdrant similarity threshold 0.92
- Budget dashboard: real-time cost tracking + alerts
- Civic data protocol: ODbL export (data.gouv.fr compatible)
- Multilingual: FR/EN/DE/ES + Polly voice per language
- Admin panel: consolidated supervision API

---

## [1.3.0] - 2026-09-XX

### Added (Sprint 6)
- XP gamification: 8 actions, 15 badges, 5 citizen levels
- AI-generated urban quests: weekly via Mistral
- Anonymized leaderboard: deterministic pseudonyms
- City registry: multi-city without redeploy
- NLP sentiment: neighborhood mood score
- Firebase push notifications: RGPD opt-in

---

## [1.2.0] - 2026-08-XX

### Added (Sprint 5)
- STT: Whisper API (audio to text, RGPD compliant)
- TTS: Amazon Polly Lea FR neural + Redis cache
- Voice pipeline: WebSocket Hey Yuni < 3s E2E
- Citizen reports: vocal + auto-categorization
- Merchant AI: 7 content types generator
- Newcomer onboarding: vocal guide

---

## [1.1.0] - 2026-07-XX

### Added (Sprint 4)
- Chat with Redis memory: 30 messages + territorial context
- ReAct agent: 3 tools (actors, vitality, recommendations)
- City dashboard API: 4 endpoints + role city_dashboard
- Production deploy: Railway + 100% rollout
- Pro subscription: Stripe + 4 webhook guards
- Load testing: k6 500 VUs + SLO documentation

---

## [1.0.0] - 2026-06-XX

### Added (Sprints 0-3)
- POST /v1/recommend/engagement: semantic RAG pipeline
- Redis cache-aside + semantic cache Qdrant
- Vitality index: 5 dimensions, grades A-E, 30-day cache
- Feature flag: deterministic rollout by user hash
- Monitoring: cost tracking + budget alerts
- RGPD: DELETE /v1/ai/user-data/:hash
