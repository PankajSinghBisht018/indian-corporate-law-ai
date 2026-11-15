"""
payment_service/main.py — Standalone FastAPI app for Razorpay Payments & Subscriptions
Runs independently on port 8004.
"""
import logging
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pythonjsonlogger import jsonlogger

from shared.config.settings import get_settings
from shared.database.mongo import DatabaseManager
from services.payment_service.router import router


def setup_logging():
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s', datefmt='%H:%M:%S')
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(formatter)
    root.addHandler(ch)

setup_logging()
logger = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request.state.request_id = str(uuid.uuid4())
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Payment Service starting...")
    await DatabaseManager.connect_db()
    yield
    await DatabaseManager.close_db()
    logger.info("🛑 Payment Service shutdown complete")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="LegalBuddy — Payment Service", version=settings.APP_VERSION, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware, 
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True, 
        allow_methods=["*"], 
        allow_headers=["*"]
    )
    app.add_middleware(RequestIDMiddleware)
    
    # Mount router with both /api/payments and root prefixes for direct and proxied calls
    app.include_router(router, prefix="/api/payments")
    app.include_router(router)

    @app.get("/health", tags=["infra"])
    async def health():
        return {
            "status": "ok", 
            "service": "payment_service", 
            "port": 8004,
            "razorpay_configured": bool(settings.RAZORPAY_KEY_ID and not "placeholder" in settings.RAZORPAY_KEY_ID.lower())
        }

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.payment_service.main:app", host="0.0.0.0", port=8004, reload=True)

