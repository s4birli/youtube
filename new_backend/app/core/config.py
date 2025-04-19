import os
from pathlib import Path
from typing import Dict, List, Optional, Union

from pydantic import AnyHttpUrl, field_validator, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "YouTube Downloader API"
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and v:
            origins = [i.strip() for i in v.split(",")]
            # Filter out empty strings
            return [origin for origin in origins if origin]
        elif isinstance(v, (list, str)):
            return v
        return []

    # YouTube video download settings
    DOWNLOAD_PATH: str = "/tmp/yt_downloader"
    FILE_EXPIRY_SECONDS: int = 300  # 5 minutes
    MAX_RESOLUTION: str = "1080p"  # Maximum allowed resolution
    
    # Define supported video quality options
    SUPPORTED_QUALITIES: List[str] = ["360p", "480p", "720p", "1080p"]
    
    # FFmpeg configuration
    FFMPEG_PATH: Optional[str] = None  # Use system default if None
    
    # Debug mode
    DEBUG: bool = False
    
    class Config:
        case_sensitive = True
        env_file = ".env"


# Create instance of settings
settings = Settings()

# Ensure download directory exists
os.makedirs(settings.DOWNLOAD_PATH, exist_ok=True) 