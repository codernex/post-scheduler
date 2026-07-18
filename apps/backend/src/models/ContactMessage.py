from core import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text, DateTime, Boolean
from datetime import datetime

class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, nullable=False
    )
    is_replied: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reply_content: Mapped[str] = mapped_column(Text, nullable=True)
    replied_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
