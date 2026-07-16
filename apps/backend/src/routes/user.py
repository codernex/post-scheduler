from fastapi import APIRouter, Depends,HTTPException,status
from sqlalchemy.ext.asyncio import AsyncSession
from core import get_db
from core.dependencies import get_current_user
from models import User
from dto import CreateUserResponse

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.post("/upgrade", response_model=CreateUserResponse)
async def upgrade_user(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Toggle user tier for experimental/testing purposes
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented yet, stay tuned for update")