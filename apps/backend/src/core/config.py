from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    LINKEDIN_CLIENT_ID:str
    LINKEDIN_CLIENT_SECRET:str
    LINKEDIN_REDIRECT_URI:str
    JWT_SECRET:str
    ALGORITHM:str="HS256"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()  # type: ignore
