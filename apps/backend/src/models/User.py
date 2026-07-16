from core import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.SocialMedia import user_social_media_table
from sqlalchemy import String, DateTime
from datetime import datetime


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(500), nullable=False)
    social_media: Mapped[list["SocialMedia"]] = relationship(
        secondary=user_social_media_table, back_populates="users"
    )
    api_tokens: Mapped[list["ApiToken"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, nullable=False
    )
    timezone: Mapped[str] = mapped_column(String, default="UTC", nullable=True)
    role: Mapped[str] = mapped_column(String(50), default="user", server_default="user", nullable=False)
    tier: Mapped[str] = mapped_column(String(50), default="free", server_default="free", nullable=False)


