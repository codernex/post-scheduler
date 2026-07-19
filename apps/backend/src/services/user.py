from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import bcrypt
import secrets
from utils import generate_jwt
from utils.smtp import send_smtp_email
from core.config import settings
from core.redis_client import redis_client
from dto import CreateUserPayload, LoginResponse, CreateUserResponse
from models import User


class UserService:
    def __init__(self, db: AsyncSession):
        self._db = db

    async def create_user(self, payload: CreateUserPayload) -> User:
        hashed_pwd = self._hash_password(payload.password)

        user = User(
            username=payload.username,
            email=payload.email,
            password=hashed_pwd,
            is_verified=False
        )

        self._db.add(user)
        await self._db.flush()

        # Generate a 5-minute activation token stored in Redis
        token = secrets.token_urlsafe(32)
        redis_key = f"verification_token:{token}"
        # Store email associated with verification token for 5 minutes (300 seconds)
        await redis_client.set(redis_key, payload.email, ex=300)

        # Send SMTP verification email
        verification_link = f"{settings.FRONTEND_URL}/auth/verify?token={token}"
        
        subject = "Activate your PostScheduler account"
        text_body = (
            f"Hi {payload.username},\n\n"
            f"Thank you for registering at PostScheduler!\n"
            f"Please verify your email address to activate your account by clicking the link below (expires in 5 minutes):\n"
            f"{verification_link}\n\n"
            f"If you did not request this, you can safely ignore this email."
        )
        html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {{
      background-color: #f4f5f7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      background-color: #f4f5f7;
      padding: 40px 0;
    }}
    .container {{
      max-width: 540px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border: 1px solid #e5e7eb;
    }}
    .header {{
      padding: 32px 32px 20px 32px;
      text-align: center;
    }}
    .logo {{
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #4f46e5;
      text-decoration: none;
    }}
    .content {{
      padding: 0 32px 32px 32px;
    }}
    h1 {{
      color: #111827;
      font-size: 22px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 16px;
      text-align: center;
      letter-spacing: -0.3px;
    }}
    p {{
      color: #4b5563;
      font-size: 15px;
      line-height: 24px;
      margin-top: 0;
      margin-bottom: 20px;
    }}
    .button-container {{
      text-align: center;
      margin: 28px 0;
    }}
    .button {{
      display: inline-block;
      background-color: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
    }}
    .warning-box {{
      background-color: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 24px;
    }}
    .warning-text {{
      color: #b45309;
      font-size: 13px;
      line-height: 18px;
      margin: 0;
      text-align: center;
      font-weight: 500;
    }}
    .footer {{
      background-color: #fafafb;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #f3f4f6;
    }}
    .footer-text {{
      color: #9ca3af;
      font-size: 12px;
      line-height: 18px;
      margin: 0;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="logo">PostScheduler</span>
      </div>
      <div class="content">
        <h1>Verify your email address</h1>
        <p>Hi <strong>{payload.username}</strong>,</p>
        <p>Thank you for signing up for PostScheduler! Please verify your email address to activate your account and start scheduling your social media posts.</p>
        <div class="button-container">
          <a href="{verification_link}" class="button" target="_blank">Verify Email Address</a>
        </div>
        <div class="warning-box">
          <p class="warning-text">⚠️ This link will expire in 5 minutes. If you did not create this account, you can safely ignore this email.</p>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">&copy; 2026 PostScheduler. All rights reserved.</p>
        <p class="footer-text" style="margin-top: 4px;">Automate your social posting queue with AI.</p>
      </div>
    </div>
  </div>
</body>
</html>
"""
        # Dispatch the email asynchronously (non-blocking log or delivery)
        try:
            send_smtp_email(to_email=payload.email, subject=subject, body=text_body, html_body=html_body)
        except Exception as e:
            # Don't fail the signup if email sending fails, but log it
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send signup verification email: {e}")

        return user

    async def find_user_by_email(self, email: str) -> User | None:
        result = await self._db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def login(self, email: str, password: str) -> LoginResponse:
        user = await self.find_user_by_email(email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        if not self._verify_password(password, user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect password"
            )

        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email address not verified. Please check your inbox for the activation link."
            )

        access_token = generate_jwt(user)
        return LoginResponse(
            access_token=access_token,
            user=CreateUserResponse(
                id=user.id,
                email=user.email,
                username=user.username,
                created_at=user.created_at,
                role=user.role,
                tier=user.tier,
                is_verified=user.is_verified
            ),
            token_type="Bearer"
        )

    @staticmethod
    def _hash_password(plain_password: str) -> str:
        pw_bytes = plain_password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_bytes = bcrypt.hashpw(pw_bytes, salt)
        return hashed_bytes.decode('utf-8')

    @staticmethod
    def _verify_password(plain_password: str, hashed_password: str) -> bool:
        pw_bytes = plain_password.encode('utf-8')
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pw_bytes, hash_bytes)
