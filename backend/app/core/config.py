import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MACHINEGUARD"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "MACHINEGUARD_SECRET_KEY_INDUSTRIAL_2026"
    
    # SQLite Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./machineguard.db")

    class Config:
        case_sensitive = True

settings = Settings()
