from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class CreateSchedulePayload(BaseModel):
    social_media_id: int
    recurrence: int = 1
    recurrence_unit: str = "days"
    scheduled_at: datetime
    prompt: str | None = None


# 1. Define an Enum for your status so your frontend gets strict typing
class ScheduleStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"
    # Add any other statuses you might use (e.g., CANCELED, DRAFT)


# 2. The main Response DTO
class ScheduleResponse(BaseModel):
    id: int
    user_id: int
    social_media_id: int
    recurrence: int
    recurrence_unit: str
    status: ScheduleStatus

    # Time and Date fields
    scheduled_at: datetime
    user_timezone: str
    created_at: datetime
    updated_at: datetime
    prompt: str | None

    # 3. This config tells Pydantic to read data directly from the SQLAlchemy model
    model_config = ConfigDict(from_attributes=True)


class SchedulerLogResponse(BaseModel):
    id: int
    scheduler_id: int
    created_at: datetime
    post_content: str
    status: str
    detail: str | None

    model_config = ConfigDict(from_attributes=True)

