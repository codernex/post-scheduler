from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, ConfigDict, field_validator


class CreateSchedulePayload(BaseModel):
    social_media_id: int
    recurrence: int = 1
    recurrence_unit: str = "day"   # 'minute' | 'hour' | 'day'
    # How many total times this schedule should fire.
    # e.g. max_runs=10 with recurrence=30, recurrence_unit='minute'
    # means "post every 30 minutes, 10 times total".
    max_runs: int = 1
    scheduled_at: datetime
    prompt: str | None = None


# 1. Define an Enum for your status so your frontend gets strict typing
class ScheduleStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"
    PENDING = "PENDING"
    FINISHED = "FINISHED"
    # Add any other statuses you might use (e.g., CANCELED, DRAFT)


# 2. The main Response DTO
class ScheduleResponse(BaseModel):
    id: int
    user_id: int
    social_media_id: int
    recurrence: int
    recurrence_unit: str
    max_runs: int
    runs_completed: int
    status: ScheduleStatus

    # Time and Date fields
    scheduled_at: datetime
    user_timezone: str
    created_at: datetime
    updated_at: datetime
    prompt: str | None

    # 3. This config tells Pydantic to read data directly from the SQLAlchemy model
    model_config = ConfigDict(from_attributes=True)

    @field_validator("scheduled_at", "created_at", "updated_at", mode="after")
    @classmethod
    def ensure_utc(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v


class SchedulerLogResponse(BaseModel):
    id: int
    scheduler_id: int
    created_at: datetime
    post_content: str
    status: str
    detail: str | None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("created_at", mode="after")
    @classmethod
    def ensure_utc(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

