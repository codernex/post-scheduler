import datetime

from pydantic import BaseModel


class CreateUserPayload(BaseModel):
    username: str
    email: str
    password: str


class CreateUserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime.datetime
    role: str
    tier: str
    is_verified: bool
    auto_post: bool = True
    email_notifications: bool = True


class UpdateUserSettingsPayload(BaseModel):
    auto_post: bool | None = None
    email_notifications: bool | None = None





class LoginPayload(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    user:CreateUserResponse
    token_type:str="Bearer"