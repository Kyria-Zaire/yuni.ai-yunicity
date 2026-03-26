"""Structured logging configuration with PII filtering."""

import logging
from collections.abc import MutableMapping
from typing import Any

import structlog

PII_KEYS = frozenset({
    "user_id",
    "email",
    "ip_address",
    "name",
    "phone",
    "address",
    "password",
    "token",
})


def _filter_pii(
    _logger: Any,
    _method_name: str,
    event_dict: MutableMapping[str, Any],
) -> MutableMapping[str, Any]:
    """Mask PII fields in log events."""
    for key in PII_KEYS:
        if key in event_dict:
            event_dict[key] = "***REDACTED***"
    return event_dict


def configure_logging(level: str = "info", *, is_dev: bool = False) -> None:
    """Set up structlog with JSON or console renderer."""
    processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        _filter_pii,
    ]

    if is_dev:
        processors.append(structlog.dev.ConsoleRenderer(colors=True))
    else:
        processors.append(structlog.processors.JSONRenderer())

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    logging.basicConfig(
        format="%(message)s",
        level=getattr(logging, level.upper(), logging.INFO),
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Return a named structlog logger."""
    logger: structlog.stdlib.BoundLogger = structlog.get_logger(name)
    return logger
