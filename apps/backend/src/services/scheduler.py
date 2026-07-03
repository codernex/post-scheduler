import enum
import zoneinfo
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from models import User, Scheduler, SchedulerLog
from dto import CreateSchedulePayload


class SchedulerStatus(enum.Enum):
    SCHEDULED = "SCHEDULED"
    PENDING = "PENDING"
    FINISHED = "FINISHED"



class SchedulerService:
    def __init__(self, db: AsyncSession):
        self._db = db

    async def create_schedule(self, payload: CreateSchedulePayload, user_id: int) -> Scheduler:
        # 1. Fetch user
        user = await self._db.get(User, user_id)

        # 2. Extract string safely (handles if user is None AND if timezone is None)
        user_tz_string = user.timezone if (user and user.timezone) else "UTC"

        # 3. Create the ZoneInfo object safely
        try:
            tz = zoneinfo.ZoneInfo(user_tz_string)
        except zoneinfo.ZoneInfoNotFoundError:
            # Fallback to UTC if the database had garbage data (e.g. "Fake/Timezone")
            tz = zoneinfo.ZoneInfo("UTC")
            user_tz_string = "UTC"  # Update the string so we save the corrected version

        # 4. Localize the time
        naive_time = payload.scheduled_at.replace(tzinfo=None)
        localized_time = naive_time.replace(tzinfo=tz)

        # 5. Prepare data and save
        schedule_data = payload.model_dump(exclude={"scheduled_at"})

        schedule = Scheduler(
            **schedule_data,
            scheduled_at=localized_time,
            user_id=user_id,
            user_timezone=user_tz_string,
            status=SchedulerStatus.PENDING.value
        )

        self._db.add(schedule)
        await self._db.commit()
        await self._db.refresh(schedule)

        # 6. Add initial creation log entry
        initial_log = SchedulerLog(
            scheduler_id=schedule.id,
            post_content=f"Post will be generated using prompt: {payload.prompt}" if payload.prompt else "Default scheduler setup (no custom prompt)",
            status="INFO",
            detail="Schedule created successfully and registered in active queue."
        )
        self._db.add(initial_log)
        await self._db.commit()

        # Refresh schedule one more time to fetch relationship states
        await self._db.refresh(schedule)

        return schedule

    async def get_schedule(self, user_id: int) -> list[Scheduler]:
        schedule = await self._db.execute(
            select(Scheduler).where(Scheduler.user_id == user_id).order_by(Scheduler.scheduled_at.desc())
        )
        return schedule.scalars().all()

    async def delete_schedule(self, schedule_id: int, user_id: int) -> None:
        stmt = select(Scheduler).where(Scheduler.id == schedule_id, Scheduler.user_id == user_id)
        result = await self._db.execute(stmt)
        schedule = result.scalar_one_or_none()
        
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found or unauthorized to delete")
        
        await self._db.delete(schedule)
        await self._db.commit()

    async def get_schedule_logs(self, schedule_id: int, user_id: int) -> list[SchedulerLog]:
        # Verify schedule ownership first
        stmt = select(Scheduler).where(Scheduler.id == schedule_id, Scheduler.user_id == user_id)
        result = await self._db.execute(stmt)
        schedule = result.scalar_one_or_none()
        
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found or unauthorized")
        
        stmt_logs = select(SchedulerLog).where(SchedulerLog.scheduler_id == schedule_id).order_by(SchedulerLog.created_at.desc())
        result_logs = await self._db.execute(stmt_logs)
        return list(result_logs.scalars().all())

