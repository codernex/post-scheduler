from datetime import datetime
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base
from utils.crypto import encrypt_data, decrypt_data


class ApiToken(Base):
    __tablename__ = "api_tokens"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    social_media_id: Mapped[int] = mapped_column(Integer, ForeignKey("social_media.id"), index=True, nullable=False)

    access_token_encrypted: Mapped[str] = mapped_column(String(2000), nullable=False)
    refresh_token_encrypted: Mapped[str] = mapped_column(String(2000), nullable=True)

    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    token_type: Mapped[str] = mapped_column(String(50), nullable=True)
    scopes: Mapped[str] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="api_tokens")
    social_media: Mapped["SocialMedia"] = relationship()

    @property
    def access_token(self) -> str:
        decrypted = decrypt_data(self.access_token_encrypted)
        return decrypted if decrypted is not None else ""

    @access_token.setter
    def access_token(self, val: str):
        self.access_token_encrypted = encrypt_data(val) or ""

    @property
    def refresh_token(self) -> str | None:
        if not self.refresh_token_encrypted:
            return None
        return decrypt_data(self.refresh_token_encrypted)

    @refresh_token.setter
    def refresh_token(self, val: str | None):
        if val is None:
            self.refresh_token_encrypted = None
        else:
            self.refresh_token_encrypted = encrypt_data(val)

    @property
    def is_expired(self) -> bool:
        """
        Helper property to check if the access token has expired.
        """
        if not self.expires_at:
            return False
        return datetime.now() >= self.expires_at
