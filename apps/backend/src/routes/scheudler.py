from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.dependencies import get_current_user
from services.scheduler import SchedulerService
from core import get_db
from dto import CreateSchedulePayload, ScheduleResponse
from models import User

scheduler_router = APIRouter(
    prefix="/scheduler",
    tags=["Scheduler"],
)


@scheduler_router.post("/", tags=["Scheduler"], response_model=ScheduleResponse)
async def create_schedule(payload: CreateSchedulePayload, db: AsyncSession = Depends(get_db),
                          current_user: User = Depends(get_current_user)):
    scheduler_service = SchedulerService(db)
    scheduler = await scheduler_service.create_schedule(
        payload,
        user_id=current_user.id
    )
    return scheduler
