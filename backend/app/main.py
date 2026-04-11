import os
import time
from contextlib import asynccontextmanager

import structlog
import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError
from starlette.middleware.base import BaseHTTPMiddleware

from app.database.connection import Base, engine
from app.logging_config import configure_logging
from app.models import model
from app.repositories.settings import settings

configure_logging(
    log_level=settings.LOG_LEVEL,
    json_logs=settings.LOG_FORMAT == "json",
)

logger = structlog.get_logger()

from app.routers.account_router import account_router
from app.routers.budget_router import budget_router
from app.routers.fund_flow_router import fund_flow_router
from app.routers.category_router import category_router
from app.routers.insights_router import insights_router
from app.routers.ledger_router import ledger_router
from app.routers.mutual_funds_router import mutual_funds_router
from app.routers.net_worth_router import net_worth_router
from app.routers.physical_assets_router import physical_assets_router
from app.routers.search_router import search_router
from app.routers.system_router import system_router
from app.routers.tag_router import tag_router
from app.routers.transaction_router import transaction_router
from app.routers.user_router import user_router
from app.version import __version__


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.info(
            "request_handled",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
        )
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("app_startup")
    Base.metadata.create_all(bind=engine)
    yield
    logger.info("app_shutdown")


app = FastAPI(version=__version__, lifespan=lifespan)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    logger.error("db_integrity_error", detail=str(exc.orig))
    return JSONResponse(
        status_code=409,
        content={"detail": "Database constraint violation."},
    )


@app.exception_handler(OperationalError)
async def operational_error_handler(request: Request, exc: OperationalError):
    logger.error("db_operational_error", detail=str(exc.orig))
    return JSONResponse(
        status_code=503,
        content={"detail": "Database is unavailable. Please try again later."},
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    logger.warning("value_error", detail=str(exc))
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)},
    )


app.include_router(user_router)
app.include_router(ledger_router)
app.include_router(account_router)
app.include_router(transaction_router)
app.include_router(tag_router)
app.include_router(category_router)
app.include_router(insights_router)
app.include_router(physical_assets_router)
app.include_router(mutual_funds_router)
app.include_router(net_worth_router)
app.include_router(budget_router)
app.include_router(search_router)
app.include_router(fund_flow_router)
app.include_router(system_router)

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        ssl_keyfile=os.getenv("SSL_KEYFILE") or None,
        ssl_certfile=os.getenv("SSL_CERTFILE") or None,
    )
