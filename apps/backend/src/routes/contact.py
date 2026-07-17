from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from core.dependencies import get_current_user
from models.User import User
from models.ContactMessage import ContactMessage
from dto.contact import ContactCreate, ContactResponse

router = APIRouter(prefix="/contact", tags=["Contact"])

@router.post("/submit", status_code=status.HTTP_201_CREATED)
async def submit_contact_form(payload: ContactCreate, db: AsyncSession = Depends(get_db)):
    db_msg = ContactMessage(
        name=payload.name,
        email=payload.email,
        message=payload.message
    )
    db.add(db_msg)
    await db.commit()
    return {"message": "Contact message submitted successfully"}

@router.get("/list", response_model=list[ContactResponse])
async def list_contact_messages(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin privilege required"
        )
    
    result = await db.execute(select(ContactMessage).order_by(ContactMessage.created_at.desc()))
    messages = result.scalars().all()
    return messages
