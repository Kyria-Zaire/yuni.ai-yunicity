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
    YuniAIError,
)
from app.core.http_client import close_http_client, init_http_client
from app.core.logging import configure_logging, get_logger
from app.models.common import ProblemDetail
from app.routers import health
from app.routers import recommend as recommend_router_mod
from app.routers import rgpd as rgpd_router_mod
from app.services.mistral_service import MistralService
from app.services.recommendation_service import RecommendationService
from app.services.redis_service import RedisService, set_global_redis_service
from app.services.rollout_service import RolloutService

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
    recommendation_service = RecommendationService(
        redis=redis_service,
        mistral=mistral_service,
        yunicity=yunicity_service,
    )
    rollout_service = RolloutService(settings)

    application.state.recommendation_service = recommendation_service
    application.state.rollout_service = rollout_service

    logger.info(
        "application_starting",
        version=settings.APP_VERSION,
        environment=settings.YUNI_ENV,
        rollout_pct=settings.ROLLOUT_PERCENTAGE,
        rollout_cities=settings.rollout_cities_list,
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

    app.include_router(health.router)
    app.include_router(recommend_router_mod.router)
    app.include_router(rgpd_router_mod.router)

    return app


app = create_app()
