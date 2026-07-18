from pydantic import BaseModel
from datetime import datetime

class ContactCreate(BaseModel):
    name: str
    email: str
    message: str

class ContactReply(BaseModel):
    reply: str

class ContactResponse(BaseModel):
    id: int
    name: str
    email: str
    message: str
    created_at: datetime
    is_replied: bool
    reply_content: str | None = None
    replied_at: datetime | None = None

    class Config:
        from_attributes = True
