from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "STQMS API"
    API_V1_STR: str = "/api"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080
    DATABASE_URL: str

    class Config:
        env_file = ".env"

settings = Settings()