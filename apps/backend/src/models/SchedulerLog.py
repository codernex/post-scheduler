from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from core import Base

class SchedulerLog(Base):
    __tablename__ = "scheduler_logs"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    scheduler_id: Mapped[int] = mapped_column(Integer, ForeignKey('scheduler.id', ondelete='CASCADE'), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    post_content: Mapped[str] = mapped_column(String(5000))
    status: Mapped[str] = mapped_column(String(20))
    detail: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    scheduler = relationship("Scheduler", back_populates="logs")
