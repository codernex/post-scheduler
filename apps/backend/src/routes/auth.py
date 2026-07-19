from typing import Any

from fastapi import APIRouter, HTTPException, status
from fastapi.params import Depends
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core import get_db
from core.dependencies import get_current_user
from dto import CreateUserPayload, CreateUserResponse, LoginPayload, LoginResponse
from models import User
from services.user import UserService

auth_router = APIRouter(
    prefix="/auth",
    tags=["Auth"],

)


@auth_router.post("/signup", response_model=CreateUserResponse, status_code=201)
async def signup(payload: CreateUserPayload, db: AsyncSession = Depends(get_db)) -> Any:
    user_service = UserService(db)
    try:
        user = await user_service.create_user(payload)
    except IntegrityError as e:
        await db.rollback()

        # Extract the raw database error message
        error_msg = str(e.orig).lower()

        # Check which constraint failed (update these strings to match your actual index/constraint names)
        if "users_email_key" in error_msg or "email" in error_msg:
            detail_msg = "This email is already registered."
        elif "users_username_key" in error_msg or "username" in error_msg:
            detail_msg = "This username is already taken."
        else:
            detail_msg = "A database conflict occurred."

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail_msg
        )
    return user


@auth_router.post("/login", response_model=LoginResponse, status_code=200)
async def login(payload: LoginPayload, db: AsyncSession = Depends(get_db)):
    user_service = UserService(db)
    user = await user_service.login(email=payload.email, password=payload.password)
    return user


@auth_router.get("/verify-email", status_code=200)
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    from core.redis_client import redis_client
    redis_key = f"verification_token:{token}"
    email = await redis_client.get(redis_key)
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token."
        )
        
    user_service = UserService(db)
    user = await user_service.find_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    user.is_verified = True
    await db.commit()
    
    # Delete token from redis
    await redis_client.delete(redis_key)
    
    return {"message": "Email verified successfully. You can now log in."}


@auth_router.get("/me", response_model=CreateUserResponse, status_code=200)
async def me(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_service = UserService(db)

    result = await user_service.find_user_by_email(email=current_user.email)
    return result
