import enum
import zoneinfo
from datetime import datetime, timezone
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
        # The frontend sends a timezone-aware ISO string (e.g. "2026-07-04T11:25:00+06:00").
        # Pydantic parses it with the correct tzinfo automatically.

        incoming_dt = payload.scheduled_at

        # If the frontend somehow sends a naive datetime, fall back to the user's profile TZ
        if incoming_dt.tzinfo is None:
            user = await self._db.get(User, user_id)
            user_tz_string = user.timezone if (user and user.timezone) else "UTC"
            try:
                tz = zoneinfo.ZoneInfo(user_tz_string)
            except zoneinfo.ZoneInfoNotFoundError:
                tz = zoneinfo.ZoneInfo("UTC")
                user_tz_string = "UTC"
            incoming_dt = incoming_dt.replace(tzinfo=tz)
        else:
            # Detect IANA timezone name from the offset for display purposes
            user_tz_string = str(incoming_dt.tzinfo)
            # If it's a fixed offset (not IANA name), store as UTC±HH:MM
            if not user_tz_string or user_tz_string.startswith("UTC"):
                offset = incoming_dt.utcoffset()
                total_seconds = int(offset.total_seconds())
                sign = "+" if total_seconds >= 0 else "-"
                hours, remainder = divmod(abs(total_seconds), 3600)
                minutes = remainder // 60
                user_tz_string = f"UTC{sign}{hours:02d}:{minutes:02d}"

        # Convert to UTC for consistent storage
        utc_time = incoming_dt.astimezone(timezone.utc)

        # Prepare data and save
        schedule_data = payload.model_dump(exclude={"scheduled_at"})

        schedule = Scheduler(
            **schedule_data,
            scheduled_at=utc_time,
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

