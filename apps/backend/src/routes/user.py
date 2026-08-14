from fastapi import APIRouter, Depends,HTTPException,status
from sqlalchemy.ext.asyncio import AsyncSession
from core import get_db
from core.dependencies import get_current_user
from models import User
from dto import CreateUserResponse, UpdateUserSettingsPayload

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.patch("/me", response_model=CreateUserResponse)
async def update_user_settings(payload: UpdateUserSettingsPayload, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = await db.get(User, current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if payload.auto_post is not None:
        user.auto_post = payload.auto_post
        from sqlalchemy import update
        from models import Scheduler
        await db.execute(
            update(Scheduler)
            .where(Scheduler.user_id == user.id)
            .values(auto_post=payload.auto_post)
        )

    if payload.email_notifications is not None:
        user.email_notifications = payload.email_notifications

    await db.commit()
    await db.refresh(user)
    return user


@router.post("/upgrade", response_model=CreateUserResponse)
async def upgrade_user(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Toggle user tier for experimental/testing purposes
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented yet, stay tuned for update")