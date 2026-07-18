from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import logging
from core.database import get_db
from core.dependencies import get_current_user
from models.User import User
from models.ContactMessage import ContactMessage
from dto.contact import ContactCreate, ContactResponse, ContactReply
from utils.smtp import send_smtp_email

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/contact", tags=["Contact"])

def get_user_confirmation_html(name: str, message: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
        .header {{ background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; padding: 32px 24px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }}
        .content {{ padding: 32px 24px; line-height: 1.6; font-size: 16px; }}
        .greeting {{ font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #1e293b; }}
        .quote-box {{ background-color: #f1f5f9; border-left: 4px solid #6366f1; border-radius: 8px; padding: 16px; margin: 24px 0; font-style: italic; font-size: 14px; color: #475569; }}
        .footer {{ background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; padding: 24px; font-size: 12px; color: #64748b; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PostScheduler</h1>
        </div>
        <div class="content">
            <div class="greeting">Hello {name},</div>
            <p>Thank you for reaching out to us. We have successfully received your inquiry and our team will get in touch with you shortly.</p>
            <p>For your records, here is a copy of your message:</p>
            <div class="quote-box">
                "{message}"
            </div>
            <p>Best regards,<br><strong>The PostScheduler Team</strong></p>
        </div>
        <div class="footer">
            &copy; 2026 PostScheduler. All rights reserved.<br>
            Automating social media posting.
        </div>
    </div>
</body>
</html>"""

def get_admin_notification_html(name: str, email: str, message: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }}
        .header {{ background-color: #0f172a; color: #ffffff; padding: 24px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 20px; }}
        .content {{ padding: 32px 24px; line-height: 1.6; }}
        .field {{ margin-bottom: 16px; }}
        .label {{ font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }}
        .val {{ font-size: 15px; color: #1e293b; font-weight: 600; }}
        .message-text {{ background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 8px; font-size: 14px; color: #334155; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Contact Submission</h1>
        </div>
        <div class="content">
            <div class="field">
                <div class="label">From Name</div>
                <div class="val">{name}</div>
            </div>
            <div class="field">
                <div class="label">From Email</div>
                <div class="val">{email}</div>
            </div>
            <div class="field">
                <div class="label">Submission Message</div>
                <div class="message-text">{message}</div>
            </div>
        </div>
    </div>
</body>
</html>"""

def send_contact_notifications(name: str, email: str, message: str):
    """
    Background task to notify administrator of new contact message
    and send a confirmation auto-reply to the user.
    """
    # 1. Notify Admin
    admin_subject = f"New Contact Message Received - {name}"
    admin_body = f"New contact message from {name} ({email}):\n\n{message}"
    admin_html = get_admin_notification_html(name, email, message)
    try:
        send_smtp_email("admin@codernex.dev", admin_subject, admin_body, admin_html)
    except Exception as exc:
        logger.error("Failed to notify admin: %s", exc)

    # 2. Auto-reply to User
    user_subject = "We received your inquiry - PostScheduler"
    user_body = f"Hello {name},\n\nWe received your message and will get back to you shortly.\n\nYour message:\n\"{message}\"\n\nBest regards,\nPostScheduler Team"
    user_html = get_user_confirmation_html(name, message)
    try:
        send_smtp_email(email, user_subject, user_body, user_html)
    except Exception as exc:
        logger.error("Failed to auto-reply to user %s: %s", email, exc)

@router.post("/submit", status_code=status.HTTP_201_CREATED)
async def submit_contact_form(
    payload: ContactCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    db_msg = ContactMessage(
        name=payload.name,
        email=payload.email,
        message=payload.message
    )
    db.add(db_msg)
    await db.commit()
    
    background_tasks.add_task(send_contact_notifications, payload.name, payload.email, payload.message)
    
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

@router.post("/{message_id}/reply")
async def reply_to_contact_message(
    message_id: int,
    payload: ContactReply,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin privilege required"
        )

    result = await db.execute(select(ContactMessage).where(ContactMessage.id == message_id))
    db_msg = result.scalar_one_or_none()

    if not db_msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact message not found"
        )

    subject = f"Re: PostScheduler Inquiry - {db_msg.name}"
    body = (
        f"Hello {db_msg.name},\n\n"
        f"Thank you for contacting us. Regarding your message:\n"
        f"\"{db_msg.message}\"\n\n"
        f"Our reply:\n"
        f"{payload.reply}\n\n"
        f"Best regards,\n"
        f"The PostScheduler Team"
    )

    try:
        send_smtp_email(to_email=db_msg.email, subject=subject, body=body)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send SMTP email: {str(exc)}"
        )

    db_msg.is_replied = True
    db_msg.reply_content = payload.reply
    db_msg.replied_at = datetime.now()

    await db.commit()
    await db.refresh(db_msg)

    return {"message": "Reply sent successfully"}
