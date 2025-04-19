import os
from pathlib import Path
from typing import Dict, List, Optional, Union

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "YouTube Downloader API"
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # YouTube video download settings
    DOWNLOAD_PATH: str = "/tmp/youtube_downloads"
    FILE_EXPIRY_SECONDS: int = 300  # 5 minutes
    MAX_RESOLUTION: str = "1080p"  # Maximum allowed resolution
    
    # Define supported video quality options
    SUPPORTED_QUALITIES: List[str] = ["360p", "720p", "1080p"]
    
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