from sqlalchemy import Column, Integer, ForeignKey, DateTime, Index, text, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from core import Base

class Scheduler(Base):
    """
    Defines WHEN and HOW a post should be generated.
    The 'status' here should only be "active", "paused", or "cancelled".
    """
    __tablename__ = "scheduler"
    __table_args__ = (
        Index(
            'uq_active_scheduler_per_user_social',
            'user_id',
            'social_media_id',
            unique=True,
            postgresql_where=text("status = 'active'"),
            sqlite_where=text("status = 'active'")
        ),
    )
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), index=True)
    social_media_id: Mapped[int] = mapped_column(Integer, ForeignKey('social_media.id'), index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    # Added onupdate so SQLAlchemy handles this automatically on commits
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    recurrence: Mapped[int] = mapped_column(Integer, default=1)
    recurrence_unit: Mapped[str] = mapped_column(String(20), default="days", server_default="days")
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)
    
    # Keeps the unique index safe. State is simply active or inactive.
    status: Mapped[str] = mapped_column(String(20), default="active")
    user_timezone: Mapped[str] = mapped_column(String(50))
    prompt: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Relationship to the new execution queue
    executions: Mapped[list["TaskExecution"]] = relationship(
        "TaskExecution", back_populates="scheduler", cascade="all, delete-orphan"
    )
    logs: Mapped[list["SchedulerLog"]] = relationship(
        "SchedulerLog", back_populates="scheduler", cascade="all, delete-orphan"
    )


class TaskExecution(Base):
    """
    Acts as the transactional queue. 
    Workers pull from here and update the status to "processing".
    """
    __tablename__ = "task_executions"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    scheduler_id: Mapped[int] = mapped_column(Integer, ForeignKey('scheduler.id'), index=True)
    
    # Status here tracks the queue: "queued", "processing", "completed", "failed"
    status: Mapped[str] = mapped_column(String(20), default="queued", index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Useful for storing LLM timeouts, rate limits, or API errors
    error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    scheduler: Mapped["Scheduler"] = relationship("Scheduler", back_populates="executions")