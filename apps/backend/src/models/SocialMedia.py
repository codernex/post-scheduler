from src.core import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Table, Column, ForeignKey, String

# Many to many with user an social media
user_social_media_table = Table(
    "user_social_media",
    Base.metadata,
    Column("user_id", ForeignKey("users.id"), primary_key=True),
    Column("social_media_id", ForeignKey("social_media.id"), primary_key=True),
)


class SocialMedia(Base):
    __tablename__ = "social_media"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    users: Mapped[list["User"]] = relationship(
        secondary=user_social_media_table, back_populates="social_media"
    )
    url: Mapped[str] = mapped_column(String(255), nullable=True)
