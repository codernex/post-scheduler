import enum

from sqlalchemy.ext.asyncio import AsyncSession

from models import User
from dto import CreateSchedulePayload
from models import Scheduler
import zoneinfo


class SchedulerStatus(enum.Enum):
    SCHEDULED = "SCHEDULED"
    RUNNING = "RUNNING"
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
            status=SchedulerStatus.SCHEDULED.value
        )

        self._db.add(schedule)
        await self._db.commit()
        await self._db.refresh(schedule)

        return schedule
