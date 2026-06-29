from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import bcrypt

from src.dto import CreateUserPayload
from src.models import User


class UserService:
    def __init__(self, db: AsyncSession):
        self._db = db

    async def create_user(self, payload: CreateUserPayload) -> User:
        hashed_pwd = self._hash_password(payload.password)

        user = User(
            username=payload.username,
            email=payload.email,
            password=hashed_pwd
        )

        self._db.add(user)
        await self._db.flush()
        return user

    async def find_user_by_email(self, email: str) -> User | None:
        # FIXED: Added 'await', and correctly referenced 'User.email == email'
        result = await self._db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def login(self, email: str, password: str) -> User:
        # FIXED: Reused your find_user_by_email method to fetch the user cleanly
        user = await self.find_user_by_email(email)

        if not user:
            # FIXED: Must 'raise' HTTPException, not 'return' it
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        if not self._verify_password(password, user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect password"
            )

        return user

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
