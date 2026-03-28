"""Yuni AI — FastAPI application entry point."""

from __future__ import annotations

import time
import uuid
from collections.abc import AsyncGenerator, Awaitable, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.dependencies import get_yunicity_service
from app.core.exceptions import (
    AuthenticationError,
    RateLimitError,
    WebhookBlockedError,
    YuniAIError,
)
from app.core.http_client import close_http_client, init_http_client
from app.core.logging import configure_logging, get_logger
from app.models.common import ProblemDetail
from app.routers import admin as admin_router_mod
from app.routers import budget as budget_router_mod
from app.routers import chat as chat_router_mod
from app.routers import cities as cities_router_mod
from app.routers import civic as civic_router_mod
from app.routers import dashboard as dashboard_router_mod
from app.routers import federation as federation_router_mod
from app.routers import gamification as gamification_router_mod
from app.routers import health
from app.routers import leaderboard as leaderboard_router_mod
from app.routers import map as map_router_mod
from app.routers import merchant as merchant_router_mod
from app.routers import onboarding as onboarding_router_mod
from app.routers import partner as partner_router_mod
from app.routers import predictive as predictive_router_mod
from app.routers import quests as quests_router_mod
from app.routers import recommend as recommend_router_mod
from app.routers import reports as reports_router_mod
from app.routers import rgpd as rgpd_router_mod
from app.routers import sentiment as sentiment_router_mod
from app.routers import stripe_webhook as stripe_router_mod
from app.routers import vitality as vitality_router_mod
from app.routers import voice as voice_router_mod
from app.services.budget_tracker import BudgetTracker
from app.services.city_registry_service import CityRegistryService
from app.services.civic_blackbox_service import CivicBlackboxService
from app.services.civic_export_service import CivicDataExportService
from app.services.embedding_service import EmbeddingService
from app.services.federation_service import FederationService
from app.services.gamification_service import GamificationService
from app.services.i18n_service import I18nService
from app.services.leaderboard_service import LeaderboardService
from app.services.mistral_router import MistralRouter
from app.services.mistral_service import MistralService
from app.services.notification_service import NotificationService
from app.services.partner_auth_service import PartnerAuthService
from app.services.predictive_service import PredictiveService
from app.services.quest_service import QuestService
from app.services.recommendation_service import RecommendationService
from app.services.redis_service import RedisService, set_global_redis_service
from app.services.rollout_service import RolloutService
from app.services.semantic_search_service import SemanticSearchService
from app.services.sentiment_service import SentimentService
from app.services.stt_service import STTService
from app.services.tts_service import TTSService
from app.services.vitality_service import VitalityIndexService

logger = get_logger("main")


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown lifecycle."""
    settings = get_settings()
    configure_logging(level=settings.LOG_LEVEL, is_dev=settings.is_dev)

    redis_service = RedisService(settings)
    set_global_redis_service(redis_service)
    health.set_redis_service(redis_service)

    http_client = await init_http_client()

    mistral_service = MistralService(settings)
    yunicity_service = get_yunicity_service(settings, http_client)

    embedding_service: EmbeddingService | None = None
    semantic_service: SemanticSearchService | None = None
    try:
        embedding_service = EmbeddingService(settings, redis_service)
        await embedding_service.ensure_collections()
        semantic_service = SemanticSearchService(embedding_service)
        health.set_embedding_service(embedding_service)
        logger.info("qdrant_connected")
    except Exception as exc:
        logger.warning("qdrant_init_failed_running_without_semantic", error=str(exc))

    recommendation_service = RecommendationService(
        redis=redis_service,
        mistral=mistral_service,
        yunicity=yunicity_service,
        semantic=semantic_service,
    )
    rollout_service = RolloutService(settings)
    vitality_service = VitalityIndexService(redis_service)

    application.state.recommendation_service = recommendation_service
    application.state.rollout_service = rollout_service
    application.state.vitality_service = vitality_service
    application.state.yunicity_service = yunicity_service
    application.state.mistral_client = mistral_service._get_client()
    application.state.semantic_service = semantic_service

    # Voice services (STT + TTS)
    stt_service: STTService | None = None
    tts_service: TTSService | None = None
    try:
        if settings.OPENAI_API_KEY:
            from openai import AsyncOpenAI
            openai_client = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY.get_secret_value(),
            )
            stt_service = STTService(openai_client)
            logger.info("stt_service_initialized")
    except Exception as exc:
        logger.warning("stt_init_failed", error=str(exc))

    try:
        aws_key = settings.AWS_ACCESS_KEY_ID.get_secret_value()
        if aws_key:
            import boto3
            polly_client = boto3.client(
                "polly",
                aws_access_key_id=aws_key,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY.get_secret_value(),
                region_name=settings.AWS_REGION,
            )
            tts_service = TTSService(
                polly_client=polly_client,
                redis=redis_service,
                voice_id=settings.TTS_VOICE_ID,
                cache_enabled=settings.TTS_CACHE_ENABLED,
            )
            logger.info("tts_service_initialized")
    except Exception as exc:
        logger.warning("tts_init_failed", error=str(exc))

    application.state.stt_service = stt_service
    application.state.tts_service = tts_service

    gamification_service = GamificationService(redis_service)
    city_registry_service = CityRegistryService(redis_service)
    leaderboard_service = LeaderboardService(redis_service, gamification_service)
    quest_service = QuestService(
        mistral_client=mistral_service._get_client(), redis=redis_service,
    )
    sentiment_service = SentimentService(
        mistral_client=mistral_service._get_client(), redis=redis_service,
    )
    notification_service = NotificationService(redis=redis_service, settings=settings)

    mistral_router = MistralRouter(redis_service)
    budget_tracker = BudgetTracker(redis_service)
    i18n_service = I18nService()
    civic_export_service = CivicDataExportService(
        city_registry=city_registry_service,
        sentiment_svc=sentiment_service,
    )

    application.state.gamification_service = gamification_service
    application.state.city_registry_service = city_registry_service
    application.state.leaderboard_service = leaderboard_service
    application.state.quest_service = quest_service
    application.state.sentiment_service = sentiment_service
    application.state.notification_service = notification_service
    civic_blackbox_service = CivicBlackboxService(redis_service)
    federation_svc = FederationService(redis_service)
    partner_auth_svc = PartnerAuthService(redis_service)
    predictive_svc = PredictiveService(
        mistral_router=mistral_router,
        redis=redis_service,
        client=mistral_service._get_client(),
    )

    application.state.mistral_router = mistral_router
    application.state.budget_tracker = budget_tracker
    application.state.i18n_service = i18n_service
    application.state.civic_export_service = civic_export_service
    application.state.civic_blackbox_service = civic_blackbox_service
    application.state.federation_service = federation_svc
    application.state.partner_auth_service = partner_auth_svc
    application.state.predictive_service = predictive_svc
    application.state.settings = settings

    logger.info(
        "application_starting",
        version=settings.APP_VERSION,
        environment=settings.YUNI_ENV,
        rollout_pct=settings.ROLLOUT_PERCENTAGE,
        semantic_enabled=semantic_service is not None,
    )
    yield

    await close_http_client()
    await redis_service.close()
    set_global_redis_service(None)
    logger.info("application_shutting_down")


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="Yuni AI API",
        version=settings.APP_VERSION,
        docs_url="/docs" if not settings.is_prod else None,
        redoc_url="/redoc" if not settings.is_prod else None,
        openapi_url="/openapi.json" if not settings.is_prod else None,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
        allow_credentials=True,
    )

    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.allowed_hosts_list,
    )

    @app.middleware("http")
    async def security_headers_middleware(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        # Swagger/ReDoc chargent CSS/JS externes + inline : incompatible avec default-src 'none'
        path = request.url.path
        openapi_ui = not settings.is_prod and (
            path == "/docs"
            or path.startswith("/docs/")
            or path == "/redoc"
            or path.startswith("/redoc/")
        )
        if not openapi_ui:
            response.headers["Content-Security-Policy"] = "default-src 'none'"
        if settings.is_prod:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        if "server" in response.headers:
            del response.headers["server"]
        return response

    @app.middleware("http")
    async def request_logging_middleware(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        start = time.perf_counter()
        response = await call_next(request)
        latency_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "http_request",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            latency_ms=round(latency_ms, 2),
            request_id=request_id,
        )
        response.headers["X-Request-ID"] = request_id
        return response

    @app.exception_handler(AuthenticationError)
    async def auth_error_handler(
        _request: Request, exc: AuthenticationError
    ) -> JSONResponse:
        detail = ProblemDetail(
            type="authentication_error",
            title="Authentication Failed",
            status=401,
            detail=exc.detail,
        )
        return JSONResponse(status_code=401, content=detail.model_dump())

    @app.exception_handler(RateLimitError)
    async def rate_limit_handler(
        _request: Request, exc: RateLimitError
    ) -> JSONResponse:
        detail = ProblemDetail(
            type="rate_limit_error",
            title="Rate Limit Exceeded",
            status=429,
            detail=exc.detail,
        )
        return JSONResponse(status_code=429, content=detail.model_dump())

    @app.exception_handler(WebhookBlockedError)
    async def webhook_blocked_handler(
        _request: Request, exc: WebhookBlockedError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=403,
            content={"detail": exc.detail},
        )

    @app.exception_handler(YuniAIError)
    async def yuni_error_handler(
        _request: Request, exc: YuniAIError
    ) -> JSONResponse:
        detail = ProblemDetail(
            type="yuni_ai_error",
            title="Bad Request",
            status=400,
            detail=exc.detail,
        )
        return JSONResponse(status_code=400, content=detail.model_dump())

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        detail = ProblemDetail(
            type="validation_error",
            title="Validation Error",
            status=422,
            detail=str(exc.errors()),
        )
        return JSONResponse(status_code=422, content=detail.model_dump())

    @app.exception_handler(Exception)
    async def unhandled_error_handler(
        _request: Request, exc: Exception
    ) -> JSONResponse:
        logger.error("unhandled_exception", error=str(exc), exc_info=True)
        detail = ProblemDetail(
            type="internal_error",
            title="Internal Server Error",
            status=500,
            detail="An unexpected error occurred",
        )
        return JSONResponse(status_code=500, content=detail.model_dump())

    @app.get("/", tags=["health"])
    async def root() -> dict[str, str]:
        """Point d'entrée navigateur : l'API n'expose pas de page HTML sur `/`."""
        payload: dict[str, str] = {
            "service": "Yuni AI API",
            "version": settings.APP_VERSION,
            "health": "/health",
        }
        if not settings.is_prod:
            payload["docs"] = "/docs"
            payload["openapi"] = "/openapi.json"
        return payload

    app.include_router(health.router)
    app.include_router(recommend_router_mod.router)
    app.include_router(rgpd_router_mod.router)
    app.include_router(vitality_router_mod.router)
    app.include_router(chat_router_mod.router)
    app.include_router(dashboard_router_mod.router)
    app.include_router(stripe_router_mod.router)
    app.include_router(voice_router_mod.router)
    app.include_router(reports_router_mod.router)
    app.include_router(merchant_router_mod.router)
    app.include_router(onboarding_router_mod.router)
    app.include_router(gamification_router_mod.router)
    app.include_router(quests_router_mod.router)
    app.include_router(leaderboard_router_mod.router)
    app.include_router(map_router_mod.router)
    app.include_router(cities_router_mod.router)
    app.include_router(sentiment_router_mod.router)
    app.include_router(budget_router_mod.router)
    app.include_router(civic_router_mod.router)
    app.include_router(admin_router_mod.router)
    app.include_router(federation_router_mod.router)
    app.include_router(predictive_router_mod.router)
    app.include_router(partner_router_mod.router)

    return app


app = create_app()
