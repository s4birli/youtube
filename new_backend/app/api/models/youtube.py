from typing import List, Optional, Dict
from pydantic import BaseModel, HttpUrl, field_validator


class YouTubeURLRequest(BaseModel):
    """Request model for YouTube URL submission"""
    url: str
    
    @field_validator('url')
    def validate_youtube_url(cls, v: str) -> str:
        """Validate URL format (simple validation, detailed validation in service)"""
        if not v or not isinstance(v, str):
            raise ValueError("URL must be a valid string")
        return v


class VideoFormatInfo(BaseModel):
    """Information about a video format"""
    format_id: str
    resolution: str
    fps: Optional[int] = None
    filesize: Optional[int] = None
    ext: Optional[str] = None
    vcodec: Optional[str] = None
    acodec: Optional[str] = None


class VideoInfo(BaseModel):
    """Response model for video information"""
    id: str
    title: str
    thumbnail: Optional[str] = None
    duration: Optional[int] = None
    uploader: Optional[str] = None
    formats: List[VideoFormatInfo]
    has_audio_only: bool


class DownloadRequest(BaseModel):
    """Request model for video download"""
    url: str
    format_id: Optional[str] = None
    audio_only: bool = False


class FileInfo(BaseModel):
    """Information about a downloaded file"""
    id: str
    original_filename: str
    created_at: str
    expires_at: str
    type: str
    download_url: str


class DownloadResponse(BaseModel):
    """Response model for download initiation"""
    success: bool
    message: str
    file_info: Optional[FileInfo] = None


class ErrorResponse(BaseModel):
    """Response model for error messages"""
    success: bool = False
    error: str
    details: Optional[str] = None 