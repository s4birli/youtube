from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Path, Query
from fastapi.responses import FileResponse, JSONResponse

from app.api.models.youtube import (
    DownloadRequest,
    DownloadResponse,
    ErrorResponse,
    VideoInfo,
    YouTubeURLRequest,
)
from app.services.youtube_service import YouTubeService
from app.utils.file_manager import FileManager

router = APIRouter()


@router.post("/info", response_model=VideoInfo, responses={400: {"model": ErrorResponse}})
async def get_video_info(request: YouTubeURLRequest) -> Any:
    """
    Get information about a YouTube video including available formats
    """
    try:
        video_info = await YouTubeService.get_video_info(request.url)
        return video_info
    except ValueError as e:
        raise HTTPException(
            status_code=400, 
            detail={"success": False, "error": "Invalid request", "details": str(e)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail={"success": False, "error": "Server error", "details": str(e)}
        )


@router.post("/download", response_model=DownloadResponse, responses={400: {"model": ErrorResponse}})
async def download_video(
    request: DownloadRequest,
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Download a YouTube video in the specified format.
    If audio_only is True, only the audio will be downloaded.
    """
    try:
        # Schedule cleanup task for expired files
        FileManager.schedule_cleanup(background_tasks)
        
        # Download the video
        file_info = await YouTubeService.download_video(
            url=request.url,
            format_id=request.format_id,
            audio_only=request.audio_only
        )
        
        # Return success response with download link
        return {
            "success": True,
            "message": "Download initiated successfully",
            "file_info": file_info
        }
    except ValueError as e:
        raise HTTPException(
            status_code=400, 
            detail={"success": False, "error": "Invalid request", "details": str(e)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail={"success": False, "error": "Server error", "details": str(e)}
        )


@router.get("/download/{file_id}")
async def serve_download(
    file_id: str = Path(..., description="Unique ID of the downloaded file"),
    background_tasks: BackgroundTasks = None,
) -> Any:
    """
    Serve a downloaded file for the user to download
    """
    if background_tasks:
        FileManager.schedule_cleanup(background_tasks)
    
    # Get file response
    file_response = FileManager.serve_file(file_id)
    
    if not file_response:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": "File not found", "details": "The requested file does not exist or has expired"}
        )
    
    return file_response


@router.get("/health")
async def health_check() -> JSONResponse:
    """
    Health check endpoint
    """
    return JSONResponse(content={"status": "ok"}) 