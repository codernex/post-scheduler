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
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 20px; }}
    .container {{ max-width: 600px; margin: 0 auto; background: rgba(30, 41, 59, 0.7); border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3); }}
    .logo-container {{ text-align: center; margin-bottom: 24px; }}
    .logo {{ font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
    h1 {{ font-size: 20px; font-weight: 700; color: #f1f5f9; text-align: center; margin-bottom: 24px; }}
    p {{ font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px; }}
    .btn-container {{ text-align: center; margin: 30px 0; }}
    .btn {{ display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); }}
    .footer {{ font-size: 12px; color: #64748b; text-align: center; margin-top: 30px; border-top: 1px solid #1e293b; padding-top: 20px; }}
    .expiry {{ color: #f59e0b; font-weight: 600; text-align: center; margin-top: 10px; font-size: 14px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <span class="logo">PostScheduler</span>
    </div>
    <h1>Verify your email address</h1>
    <p>Hi <strong>{payload.username}</strong>,</p>
    <p>Thank you for signing up for PostScheduler! Please verify your email address to activate your account and start scheduling your social media posts.</p>
    <div class="btn-container">
      <a href="{verification_link}" class="btn" target="_blank">Verify Email Address</a>
    </div>
    <p class="expiry">⚠️ This verification link will expire in 5 minutes.</p>
    <p>If you did not create an account, you can safely ignore this email.</p>
    <div class="footer">
      &copy; 2026 PostScheduler. All rights reserved.<br>
      Automate your social posting queue with AI.
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
