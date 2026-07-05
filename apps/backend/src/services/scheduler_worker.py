from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core import get_db
from models import Scheduler, ApiToken
from models.Scheduler import TaskExecution
from services.scheduler import SchedulerStatus
import utils as utils

logger = logging.getLogger(__name__)

linkedin_client = utils.LinkedInClient()


# ---------------------------------------------------------
# LinkedIn helper
# ---------------------------------------------------------
async def get_linkedin_access_token(user_id: int, db: AsyncSession) -> str:
    result = await db.execute(
        select(ApiToken).where(
            ApiToken.user_id == user_id
        )
    )
    api_token = result.scalar_one_or_none()
    if not api_token:
        raise Exception("No LinkedIn API token found for user")

    access_token = api_token.access_token
    if not access_token:
        raise Exception("Failed to decrypt LinkedIn API token")

    if api_token.expires_at < datetime.now():
        refreshed_tokens = await linkedin_client.refresh_access_token(api_token.refresh_token
                                                                      )
        if refreshed_tokens:
            api_token.access_token = refreshed_tokens["access_token"]
            api_token.expires_at = datetime.fromtimestamp(refreshed_tokens["expires_in"])
            api_token.refresh_token = refreshed_tokens["refresh_token"]
            api_token.updated_at = datetime.now()
            await db.commit()

    return access_token


# ---------------------------------------------------------
# DB context helper
# ---------------------------------------------------------
@asynccontextmanager
async def get_db_context():
    """Wraps the get_db generator so worker functions can use 'async with'."""
    async for db in get_db():
        yield db


# ---------------------------------------------------------
# Startup: recover executions stuck at "processing"
# ---------------------------------------------------------
async def recover_stuck_executions():
    """
    Called once at server startup. Finds any TaskExecution rows that were
    left at 'processing' because the server crashed or was restarted mid-run,
    and resets them back to 'queued' so they can be retried automatically.

    This is why you should NEVER manually set the scheduler status in the DB —
    this function handles recovery for you.
    """
    async with get_db_context() as db:
        try:
            result = await db.execute(
                select(TaskExecution).where(TaskExecution.status == "processing")
            )
            stuck = result.scalars().all()

            if not stuck:
                logger.info("[startup] No stuck executions found.")
                return

            for execution in stuck:
                logger.warning(
                    f"[startup] Recovering stuck execution {execution.id} "
                    f"(scheduler_id={execution.scheduler_id}) → resetting to 'queued'"
                )
                execution.status = "queued"
                execution.started_at = None

            await db.commit()
            logger.info(f"[startup] Recovered {len(stuck)} stuck execution(s).")

        except Exception as e:
            logger.error(f"[startup] recover_stuck_executions failed: {e}")
            await db.rollback()


# ---------------------------------------------------------
# Worker 1: Promote due PENDING schedules into the execution queue
# ---------------------------------------------------------
async def push_scheduler_to_task_execution():
    print("[push_scheduler_to_task_execution] Starting")
    async with get_db_context() as db:
        try:
            # 1. Fetch schedules that are due and still PENDING
            result = await db.execute(
                select(Scheduler).where(
                    Scheduler.scheduled_at <= datetime.now(timezone.utc),
                    Scheduler.status == SchedulerStatus.PENDING.value,
                ).with_for_update(skip_locked=True)
            )
            schedules = result.scalars().all()

            if not schedules:
                return

            # 2. Create a TaskExecution row for each due schedule and
            #    atomically flip the scheduler status to SCHEDULED so
            #    the same row isn't picked up again next tick.
            tasks = []
            for schedule in schedules:
                task = TaskExecution(scheduler_id=schedule.id)
                tasks.append(task)
                schedule.status = SchedulerStatus.SCHEDULED.value

            # 3. Single atomic commit — both the status flip and the
            #    task rows are written together, or neither is.
            db.add_all(tasks)
            await db.commit()

            logger.info(f"[worker] Queued {len(tasks)} task(s) at {datetime.now(timezone.utc)}")

        except Exception as e:
            logger.error(f"[worker] push_scheduler_to_task_execution failed: {e}")
            await db.rollback()


# Platform id → human-readable name used by the agent prompt
_PLATFORM_NAMES: dict[int, str] = {
    2: "LinkedIn",
}

# ---------------------------------------------------------
# Worker 2: Do the actual posting work for one execution
# ---------------------------------------------------------
async def _run_posting_logic(scheduler: Scheduler, db: AsyncSession):
    """
    Runs the platform-specific posting logic for a scheduler.

    Steps:
      1. Instantiate PostingAgent with the scheduler's prompt & platform.
      2. Agent queries Supermemory for past posts (no repeats).
      3. Agent calls Gemini to generate a fresh post.
      4. Post is published to the social platform.
      5. Agent saves the post to Supermemory for future recall.
    """
    from agent.agent import PostingAgent

    platform = _PLATFORM_NAMES.get(scheduler.social_media_id, "LinkedIn")

    agent = PostingAgent(
        scheduler_id=scheduler.id,
        prompt=scheduler.prompt,
        platform=platform,
    )

    # --- Generate the post via Gemini (informed by Supermemory context) ---
    post = await agent.generate_post()
    logger.info("[worker] Post generated (%d chars) for scheduler %d", len(post), scheduler.id)

    # --- Publish to the social platform ---
    if scheduler.social_media_id == 2:  # LinkedIn
        access_token = await get_linkedin_access_token(user_id=scheduler.user_id, db=db)
        logger.info("[worker] LinkedIn access token obtained for user %d", scheduler.user_id)
        author = linkedin_client.get_user_info(access_token)
        urn = linkedin_client.get_person_urn(author["sub"])
        linkedin_client.publish_post(access_token, urn, post)
        logger.info("[worker] Post published to LinkedIn — scheduler %d", scheduler.id)

    # --- Save to Supermemory AFTER a successful publish ---
    await agent.save_post_to_memory(post)

    return post


# ---------------------------------------------------------
# Worker 3: Advance or finish a scheduler after one execution completes
# ---------------------------------------------------------
async def mark_and_increment_schedule(db: AsyncSession, execution: TaskExecution):
    """
    After a task execution fires:
    - Runs the platform posting logic.
    - Increments runs_completed on the parent Scheduler.
    - If more runs remain, advances scheduled_at and resets status to PENDING.
    - Otherwise marks the Scheduler as FINISHED.
    - Marks the TaskExecution as 'completed'.
    If anything fails, the execution is marked 'failed' and the scheduler
    is reset to PENDING so it can be retried next cycle.
    """
    scheduler = execution.scheduler

    try:
        # Do the actual work first — before touching any counters.
        post= await _run_posting_logic(scheduler, db)

        # Advance the run counter
        scheduler.runs_completed += 1

        if scheduler.runs_completed < scheduler.max_runs:
            recurrence_unit = scheduler.recurrence_unit
            recurrence_time = scheduler.recurrence

            if recurrence_unit == "minute":
                scheduler.scheduled_at = datetime.now(timezone.utc) + timedelta(minutes=recurrence_time)
            elif recurrence_unit == "hour":
                scheduler.scheduled_at = datetime.now(timezone.utc) + timedelta(hours=recurrence_time)
            elif recurrence_unit == "day":
                scheduler.scheduled_at = datetime.now(timezone.utc) + timedelta(days=recurrence_time)
            else:
                logger.warning(f"Unknown recurrence_unit '{recurrence_unit}', defaulting to 1 day.")
                scheduler.scheduled_at = datetime.now(timezone.utc) + timedelta(days=1)

            scheduler.status = SchedulerStatus.PENDING.value
        else:
            scheduler.status = SchedulerStatus.FINISHED.value

        # Add success log entry
        from models import SchedulerLog
        success_log = SchedulerLog(
            scheduler_id=scheduler.id,
            post_content=f"Successfully posted to platform: {post}",
            status="INFO",
            detail="Scheduled execution completed successfully."
        )
        db.add(success_log)

        execution.status = "completed"
        execution.completed_at = datetime.now()

        await db.commit()

    except Exception as e:
        logger.error(f"[worker] mark_and_increment_schedule failed for execution {execution.id}: {e}")
        try:
            await db.rollback()
            # Add failure log entry
            from models import SchedulerLog
            error_log = SchedulerLog(
                scheduler_id=scheduler.id,
                post_content=f"Failed to post.",
                status="ERROR",
                detail=str(e)[:1000]
            )
            db.add(error_log)
            # Reset so the execution can be retried next cycle
            execution.status = "queued"
            execution.started_at = None
            # Keep scheduler at SCHEDULED so complete_execution picks it up again
            await db.commit()
        except Exception as rollback_err:
            logger.error(f"[worker] Rollback/recovery also failed: {rollback_err}")


# ---------------------------------------------------------
# Worker 4: Pick up queued executions and process them
# ---------------------------------------------------------
async def complete_execution():
    """
    Picks up queued TaskExecutions, marks them as processing,
    runs the posting logic, then advances or finishes the parent Scheduler.
    """
    async with get_db_context() as db:
        result = await db.execute(
            select(TaskExecution)
            .join(Scheduler)
            .options(selectinload(TaskExecution.scheduler))
            .where(TaskExecution.status == "queued")
            .with_for_update(skip_locked=True)
        )
        executions = result.scalars().all()

        if not executions:
            return

        # Atomically claim all executions before doing any heavy work
        for execution in executions:
            execution.status = "processing"
            execution.started_at = datetime.now()

        await db.commit()

        # Process each execution individually
        for execution in executions:
            logger.info(
                f"[worker] Processing execution {execution.id} "
                f"for scheduler {execution.scheduler_id}"
            )
            await mark_and_increment_schedule(db, execution)
