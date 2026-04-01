import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.connection import Base, engine
from app.models import model
from app.repositories.settings import settings
from app.routers.account_router import account_router
from app.routers.budget_router import budget_router
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    # stuff to do when app starts
    Base.metadata.create_all(bind=engine)
    yield
    # stuff to do when app stops


app = FastAPI(version=__version__, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
