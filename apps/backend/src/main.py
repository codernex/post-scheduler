import logging
from contextlib import asynccontextmanager

import uvicorn
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from routes.auth import auth_router
from routes.scheudler import scheduler_router
from routes.social import social_router
from services.scheduler_worker import (
    complete_execution,
    push_scheduler_to_task_execution,
    recover_stuck_executions,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------
# App lifespan: start / stop APScheduler
# ---------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Recover any executions left at 'processing' from a previous crash/restart
    # before the APScheduler workers start running.
    await recover_stuck_executions()

    scheduler = AsyncIOScheduler()

    # scheduler.add_job(
    #     push_scheduler_to_task_execution,
    #     IntervalTrigger(seconds=20),
    #     id="push_to_queue",
    # )
    scheduler.add_job(
        complete_execution,
        IntervalTrigger(seconds=5),
        id="complete_execution",
    )

    scheduler.start()
    logger.info("APScheduler started.")
    yield  # FastAPI serves requests here
    scheduler.shutdown()
    logger.info("APScheduler stopped.")


# ---------------------------------------------------------
# App setup
# ---------------------------------------------------------
app = FastAPI(title="Social media post scheduler", version="1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Routes
# ---------------------------------------------------------
v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(auth_router)
v1_router.include_router(social_router)
v1_router.include_router(scheduler_router)

app.include_router(v1_router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8081, app_dir="src")
