from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Path, Query
from fastapi.responses import FileResponse

from app.api.endpoints import youtube
from app.utils.file_manager import FileManager

api_router = APIRouter()

# Include YouTube endpoints
api_router.include_router(youtube.router, prefix="/youtube", tags=["youtube"])

# Add a separate direct download endpoint
@api_router.get("/download/{file_id}", tags=["download"])
async def direct_download(
    file_id: str = Path(..., description="Unique ID of the downloaded file"),
    background_tasks: BackgroundTasks = None,
) -> FileResponse:
    """
    Direct download endpoint for serving files
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