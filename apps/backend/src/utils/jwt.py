from datetime import datetime,timedelta,timezone
from fastapi import HTTPException
from src.core import settings
import jwt
from src.dto import CreateUserResponse


def generate_jwt(user:CreateUserResponse)->str:
    payload = {
        "id":str(user.id),
        "email":user.email,
        "exp":datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload,settings.JWT_SECRET,algorithm=settings.ALGORITHM)

def verify_jwt(token:str)->dict:
    try:
        payload = jwt.decode(token,settings.JWT_SECRET,algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401,detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401,detail="Invalid token")
