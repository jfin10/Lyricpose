from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./lyricpose.db"
    SECRET_KEY: str = "change-me-in-production-use-a-real-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    UPLOAD_DIR: str = "./uploads"
    WHISPER_MODEL: str = "base"  # tiny, base, small, medium, large
    MAX_FILE_SIZE_MB: int = 100

    class Config:
        env_file = ".env"


settings = Settings()
