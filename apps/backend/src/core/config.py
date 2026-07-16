import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Dynamically locate the project root and backend folder paths
_current_dir = Path(__file__).resolve().parent
_backend_dir = _current_dir.parent.parent
_root_dir = _backend_dir.parent.parent

_env_files = [
    str(_root_dir / ".env"),
    str(_backend_dir / ".env"),
]


class Settings(BaseSettings):
    DATABASE_URL: str
    LINKEDIN_CLIENT_ID: str
    LINKEDIN_CLIENT_SECRET: str
    LINKEDIN_REDIRECT_URI: str
    FACEBOOK_CLIENT_ID: str
    FACEBOOK_CLIENT_SECRET: str
    FACEBOOK_REDIRECT_URI: str
    JWT_SECRET: str
    ALGORITHM: str = "HS256"

    # LLM & Memory
    OPENROUTER_API_KEY: str
    OPENROUTER_MODEL: str = "openai/gpt-4o"
    SUPERMEMORY_API_KEY: str

    model_config = SettingsConfigDict(env_file=_env_files, case_sensitive=True)


settings = Settings()  # type: ignore
