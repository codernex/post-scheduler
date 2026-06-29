from pydantic import BaseModel
from datetime import datetime

class SocialPlatformStatus(BaseModel):
    id: int
    name: str
    connected: bool
    expires_at: datetime | None = None
