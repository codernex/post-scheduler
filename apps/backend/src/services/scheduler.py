import enum
import zoneinfo
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from models import User, Scheduler, SchedulerLog
from dto import CreateSchedulePayload, UpdateSchedulePayload


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

        # Fetch target platform connection to verify it is not Facebook
        from models import SocialMedia
        sm_result = await self._db.execute(select(SocialMedia).where(SocialMedia.id == payload.social_media_id))
        social_media = sm_result.scalar_one_or_none()
        if not social_media:
            raise HTTPException(status_code=404, detail="Social media platform connection not found")
        
        is_facebook = False
        if social_media.name.lower() == "facebook":
            is_facebook = True
        elif social_media.parent_id:
            parent_result = await self._db.execute(select(SocialMedia).where(SocialMedia.id == social_media.parent_id))
            parent_platform = parent_result.scalar_one_or_none()
            if parent_platform and parent_platform.name.lower() == "facebook":
                is_facebook = True
                
        if is_facebook:
            raise HTTPException(
                status_code=400,
                detail="Facebook scheduling is temporarily disabled for testing."
            )

        # Fetch user to check global preferences
        user = await self._db.get(User, user_id)

        # Prepare data and save
        schedule_data = payload.model_dump(exclude={"scheduled_at"})
        if "auto_post" not in schedule_data or schedule_data["auto_post"] is None:
            schedule_data["auto_post"] = user.auto_post if user else True

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

    async def update_schedule(self, schedule_id: int, payload: UpdateSchedulePayload, user_id: int) -> Scheduler:
        stmt = select(Scheduler).where(Scheduler.id == schedule_id, Scheduler.user_id == user_id)
        result = await self._db.execute(stmt)
        schedule = result.scalar_one_or_none()

        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found or unauthorized to edit")

        if payload.social_media_id is not None and payload.social_media_id != schedule.social_media_id:
            from models import SocialMedia
            sm_result = await self._db.execute(select(SocialMedia).where(SocialMedia.id == payload.social_media_id))
            social_media = sm_result.scalar_one_or_none()
            if not social_media:
                raise HTTPException(status_code=404, detail="Social media platform connection not found")
            
            is_facebook = False
            if social_media.name.lower() == "facebook":
                is_facebook = True
            elif social_media.parent_id:
                parent_result = await self._db.execute(select(SocialMedia).where(SocialMedia.id == social_media.parent_id))
                parent_platform = parent_result.scalar_one_or_none()
                if parent_platform and parent_platform.name.lower() == "facebook":
                    is_facebook = True
                    
            if is_facebook:
                raise HTTPException(
                    status_code=400,
                    detail="Facebook scheduling is temporarily disabled for testing."
                )
            schedule.social_media_id = payload.social_media_id

        if payload.recurrence is not None:
            schedule.recurrence = payload.recurrence

        if payload.recurrence_unit is not None:
            schedule.recurrence_unit = payload.recurrence_unit

        if payload.max_runs is not None:
            schedule.max_runs = payload.max_runs

        if payload.prompt is not None:
            schedule.prompt = payload.prompt

        if payload.auto_post is not None:
            schedule.auto_post = payload.auto_post

        changes_desc = []
        if payload.prompt is not None:
            changes_desc.append("Prompt updated")
        if payload.auto_post is not None:
            changes_desc.append(f"Auto post set to {schedule.auto_post}")
        if payload.recurrence is not None or payload.recurrence_unit is not None:
            changes_desc.append(f"Recurrence set to {schedule.recurrence} {schedule.recurrence_unit}(s)")
        if payload.max_runs is not None:
            changes_desc.append(f"Max runs set to {schedule.max_runs}")

        if payload.scheduled_at is not None:
            incoming_dt = payload.scheduled_at
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
                user_tz_string = str(incoming_dt.tzinfo)
                if not user_tz_string or user_tz_string.startswith("UTC"):
                    offset = incoming_dt.utcoffset()
                    total_seconds = int(offset.total_seconds()) if offset else 0
                    sign = "+" if total_seconds >= 0 else "-"
                    hours, remainder = divmod(abs(total_seconds), 3600)
                    minutes = remainder // 60
                    user_tz_string = f"UTC{sign}{hours:02d}:{minutes:02d}"

            utc_time = incoming_dt.astimezone(timezone.utc)
            schedule.scheduled_at = utc_time
            schedule.user_timezone = user_tz_string
            schedule.status = SchedulerStatus.PENDING.value
            changes_desc.append(f"Rescheduled to {incoming_dt.isoformat()}")

        if payload.reset_runs_completed or (payload.scheduled_at is not None and schedule.runs_completed >= schedule.max_runs):
            schedule.runs_completed = 0
            schedule.status = SchedulerStatus.PENDING.value
            changes_desc.append("Runs completed count reset to 0")

        schedule.updated_at = datetime.now()

        update_log = SchedulerLog(
            scheduler_id=schedule.id,
            post_content=f"Schedule updated/rescheduled: {', '.join(changes_desc) if changes_desc else 'Configuration updated'}",
            status="INFO",
            detail=f"Parameters updated by user. Current status: {schedule.status}."
        )
        self._db.add(update_log)

        await self._db.commit()
        await self._db.refresh(schedule)

        return schedule

    async def approve_and_publish_draft(self, schedule_id: int, user_id: int, post_text: str | None = None) -> Scheduler:
        stmt = select(Scheduler).where(Scheduler.id == schedule_id, Scheduler.user_id == user_id)
        result = await self._db.execute(stmt)
        schedule = result.scalar_one_or_none()

        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found or unauthorized")

        if schedule.status != "NEEDS_APPROVAL" or not schedule.draft_post_text:
            raise HTTPException(status_code=400, detail="Schedule does not have a draft post pending approval")

        final_post_text = post_text if (post_text and post_text.strip()) else schedule.draft_post_text
        image_url = schedule.draft_image_url

        from services.scheduler_worker import get_platform_access_token, linkedin_client
        from models import SocialMedia
        from fastapi.concurrency import run_in_threadpool
        import utils

        platform_result = await self._db.execute(
            select(SocialMedia).where(SocialMedia.id == schedule.social_media_id)
        )
        platform_model = platform_result.scalar_one_or_none()
        if not platform_model:
            raise HTTPException(status_code=404, detail="Social media platform connection not found")

        platform_name = platform_model.name

        if "linkedin" in platform_name.lower():
            access_token = await get_platform_access_token(schedule.user_id, schedule.social_media_id, self._db)
            author = await run_in_threadpool(linkedin_client.get_user_info, access_token)
            urn = linkedin_client.get_person_urn(author["sub"])
            await run_in_threadpool(
                linkedin_client.publish_post, access_token, urn, final_post_text, image_url
            )
        elif "facebook" in platform_name.lower() or "instagram" in platform_name.lower() or "thread" in platform_name.lower():
            access_token = await get_platform_access_token(schedule.user_id, schedule.social_media_id, self._db)
            facebook_client = utils.FacebookClient()
            author = await run_in_threadpool(facebook_client.get_user_info, access_token)
            urn = f"facebook:{author.get('id')}"
            await run_in_threadpool(
                facebook_client.publish_post, access_token, urn, final_post_text, platform_name=platform_name, image_url=image_url
            )

        from agent.agent import PostingAgent
        agent = PostingAgent(scheduler_id=schedule.id, prompt=schedule.prompt, platform=platform_name)
        await agent.save_post_to_memory(final_post_text, image_url=image_url)

        schedule.runs_completed += 1
        schedule.draft_post_text = None
        schedule.draft_image_url = None

        from datetime import timedelta
        if schedule.runs_completed < schedule.max_runs:
            unit = schedule.recurrence_unit
            rec = schedule.recurrence
            if unit == "minute":
                schedule.scheduled_at = datetime.now(timezone.utc) + timedelta(minutes=rec)
            elif unit == "hour":
                schedule.scheduled_at = datetime.now(timezone.utc) + timedelta(hours=rec)
            else:
                schedule.scheduled_at = datetime.now(timezone.utc) + timedelta(days=rec)
            schedule.status = SchedulerStatus.PENDING.value
        else:
            schedule.status = SchedulerStatus.FINISHED.value

        success_log = SchedulerLog(
            scheduler_id=schedule.id,
            post_content=f"Approved and posted to platform: {final_post_text}",
            status="INFO",
            detail="Draft post approved and published successfully."
        )
        self._db.add(success_log)
        await self._db.commit()
        await self._db.refresh(schedule)
        return schedule

    async def reject_draft(self, schedule_id: int, user_id: int) -> Scheduler:
        stmt = select(Scheduler).where(Scheduler.id == schedule_id, Scheduler.user_id == user_id)
        result = await self._db.execute(stmt)
        schedule = result.scalar_one_or_none()

        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found or unauthorized")

        schedule.draft_post_text = None
        schedule.draft_image_url = None
        schedule.status = SchedulerStatus.PENDING.value

        reject_log = SchedulerLog(
            scheduler_id=schedule.id,
            post_content="Draft post rejected by user.",
            status="INFO",
            detail="User discarded AI draft. Schedule reset to PENDING for next trigger."
        )
        self._db.add(reject_log)
        await self._db.commit()
        await self._db.refresh(schedule)
        return schedule



