from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from core.dependencies import get_current_user
from services.scheduler import SchedulerService
from core import get_db
from dto import CreateSchedulePayload, ScheduleResponse, SchedulerLogResponse
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


@scheduler_router.get("/", tags=["Scheduler"], response_model=list[ScheduleResponse])
async def get_schedule(db: AsyncSession = Depends(get_db),
                        current_user: User = Depends(get_current_user)):
    scheduler_service = SchedulerService(db)
    scheduler = await scheduler_service.get_schedule(
        user_id=current_user.id
    )
    return scheduler


@scheduler_router.delete("/{schedule_id}", tags=["Scheduler"], status_code=204)
async def delete_schedule(schedule_id: int, db: AsyncSession = Depends(get_db),
                          current_user: User = Depends(get_current_user)):
    scheduler_service = SchedulerService(db)
    await scheduler_service.delete_schedule(schedule_id, user_id=current_user.id)
    return Response(status_code=204)


@scheduler_router.get("/{schedule_id}/logs", tags=["Scheduler"], response_model=list[SchedulerLogResponse])
async def get_schedule_logs(schedule_id: int, db: AsyncSession = Depends(get_db),
                            current_user: User = Depends(get_current_user)):
    scheduler_service = SchedulerService(db)
    logs = await scheduler_service.get_schedule_logs(schedule_id, user_id=current_user.id)
    return logs

