from sqlalchemy import Column, Integer, ForeignKey, DateTime, Enum, Index, text, String
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from core import Base


class Scheduler(Base):
    __tablename__ = "scheduler"
    __table_args__ = (
        Index(
            'uq_active_scheduler_per_user_social',
            'user_id',
            'social_media_id',
            unique=True,
            # We cast the literal string 'active' to the Postgres enum type 'status' 👇
            postgresql_where=text("status = 'active'"),
            sqlite_where=text("status = 'active'")
        ),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), index=True)
    social_media_id: Mapped[int] = mapped_column(Integer, ForeignKey('social_media.id'), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    recurrence: Mapped[int] = mapped_column(Integer, default=1)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, )
    status: Mapped[str] = mapped_column(String(20))
    user_timezone: Mapped[str] = mapped_column(String(50))
