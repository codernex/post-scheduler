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



class LoginPayload(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    user:CreateUserResponse
    token_type:str="Bearer"