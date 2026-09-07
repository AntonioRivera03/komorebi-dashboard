import logging
from contextlib import asynccontextmanager
from datetime import timedelta

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, select, text
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from komorebi_server.app.composition import compose
from komorebi_server.app.middleware import RequestBoundary
from komorebi_server.core.api import create_router
from komorebi_server.core.config import Settings
from komorebi_server.core.models import Heartbeat
from komorebi_server.shared.contracts.common import AppError, ErrorBody, utcnow

log = logging.getLogger(__name__)


def create_app(settings=None, *, db=None, ai_provider=None):
    settings = settings or Settings()
    platform, modules = compose(settings, db=db, ai_provider=ai_provider)

    @asynccontextmanager
    async def lifespan(app):
        yield
        if db is None:
            platform.db.engine.dispose()

    app = FastAPI(
        title="Komorebi API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.environment != "production" else None,
        redoc_url=None,
        openapi_url="/openapi.json" if settings.environment != "production" else None,
    )
    app.state.platform, app.state.modules = platform, modules

    def error(request, code, message, status, retryable=False):
        body = ErrorBody(
            code=code,
            message=message,
            correlation_id=getattr(request.state, "correlation_id", "unavailable"),
            retryable=retryable,
        )
        return JSONResponse(status_code=status, content=body.model_dump(by_alias=True))

    @app.exception_handler(AppError)
    async def app_error(request: Request, exc: AppError):
        return error(request, exc.code, exc.message, exc.status, exc.retryable)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc):
        # Pydantic errors can echo inputs, including sign-in tickets and private content.
        return error(
            request, "validation_error", "The request does not match the API contract.", 422
        )

    @app.exception_handler(HTTPException)
    async def http_error(request, exc):
        return error(
            request,
            "http_error",
            "The requested resource or method is unavailable.",
            exc.status_code,
        )

    @app.exception_handler(Exception)
    async def unexpected_error(request, exc):
        log.error(
            "request_failed correlation_id=%s exception_type=%s",
            getattr(request.state, "correlation_id", "unavailable"),
            type(exc).__name__,
        )
        return error(request, "internal_error", "The request could not be completed.", 500)

    @app.get("/health", tags=["system"])
    def health():
        return {"status": "ok"}

    @app.get("/health/ready", tags=["system"])
    def readiness():
        try:
            with platform.db.transaction() as session:
                # Detect a missing/outdated migration as well as database connectivity.
                version = session.scalar(text("SELECT version_num FROM alembic_version"))
                heartbeat = session.scalar(select(func.max(Heartbeat.at)))
            if version != "0006_source_imports":
                return JSONResponse(
                    status_code=503,
                    content={"status": "unavailable", "database": "migration_required"},
                )
        except SQLAlchemyError:
            return JSONResponse(
                status_code=503, content={"status": "unavailable", "database": "unavailable"}
            )
        worker = "current" if heartbeat and heartbeat > utcnow() - timedelta(minutes=3) else "stale"
        return {
            "status": "ok" if worker == "current" else "degraded",
            "database": "ready",
            "worker": worker,
        }

    app.include_router(create_router(platform, modules))
    for module in modules:
        app.include_router(module.router)
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.session_secret.get_secret_value(),
        session_cookie="komorebi_session",
        same_site="strict",
        https_only=settings.secure_cookies,
        max_age=settings.session_hours * 3600,
    )
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)
    app.add_middleware(RequestBoundary, settings=settings)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Content-Type", "Idempotency-Key", "If-Match", "X-CSRF-Token"],
        expose_headers=["X-Correlation-ID"],
    )
    return app
