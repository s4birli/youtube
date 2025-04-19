import os
from fastapi import FastAPI, Request, BackgroundTasks, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import logging
from datetime import datetime

from app.api.router import api_router
from app.core.config import settings
from app.utils.file_manager import FileManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


# Add a special catch-all route for any download patterns - highest priority
@app.get("/api/v1/download/{file_id:path}")
@app.get("/api/v1/youtube/download/{file_id:path}")
async def unified_download(
    file_id: str = Path(..., description="Unique ID of the downloaded file"),
    background_tasks: BackgroundTasks = None,
):
    """
    Universal download handler that works with multiple URL patterns
    """
    logger.info(f"Universal download handler called for file: {file_id}")
    
    if background_tasks:
        FileManager.schedule_cleanup(background_tasks)
    
    # Check if file exists in all possible locations
    file_response = FileManager.serve_file(file_id)
    
    if not file_response:
        # List files in download directory
        try:
            files = os.listdir(settings.DOWNLOAD_PATH)
            logger.info(f"Files in download directory: {files}")
        except Exception as e:
            logger.error(f"Error listing download directory: {str(e)}")
        
        return JSONResponse(
            status_code=404,
            content={
                "success": False, 
                "error": "File not found",
                "details": f"The requested file '{file_id}' does not exist or has expired"
            }
        )
    
    return file_response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal Server Error",
            "details": str(exc) if os.getenv("DEBUG", "").lower() == "true" else str(exc)
        }
    )


# Root path
@app.get("/", include_in_schema=False)
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "docs": f"{settings.API_V1_STR}/docs",
        "disclaimer": "Users are responsible for the content they download. "
                    "This service does not store any content beyond a 5-minute temporary period."
    }


# Add a startup event handler
@app.on_event("startup")
async def startup_event():
    # Ensure download directory exists
    os.makedirs(settings.DOWNLOAD_PATH, exist_ok=True)
    logger.info(f"Application startup: {settings.PROJECT_NAME}")
    logger.info(f"Download directory: {settings.DOWNLOAD_PATH}")
    logger.info(f"Current directory: {os.getcwd()}")
    try:
        files = os.listdir(settings.DOWNLOAD_PATH)
        logger.info(f"Files in download directory: {files}")
    except Exception as e:
        logger.error(f"Error listing download directory: {str(e)}")


# Add diagnostic endpoints
@app.get("/api/v1/diagnostic/files")
async def list_files():
    """
    Diagnostic endpoint to list all files in the download directory
    """
    try:
        download_path = settings.DOWNLOAD_PATH
        files = os.listdir(download_path)
        
        file_details = []
        for file in files:
            file_path = os.path.join(download_path, file)
            stat = os.stat(file_path)
            file_details.append({
                "name": file,
                "path": file_path,
                "size": stat.st_size,
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })
        
        registry_files = list(FileManager._file_registry.keys())
        
        return {
            "download_path": download_path,
            "files_on_disk": file_details,
            "files_in_registry": registry_files
        }
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        return {
            "error": str(e),
            "download_path": settings.DOWNLOAD_PATH
        }

@app.get("/api/v1/diagnostic/check/{file_id}")
async def check_file(file_id: str):
    """
    Diagnostic endpoint to check if a file exists
    """
    try:
        download_path = settings.DOWNLOAD_PATH
        file_path = os.path.join(download_path, file_id)
        
        # Try to find similar files if exact match not found
        similar_files = []
        if not os.path.exists(file_path):
            file_id_base = file_id.split('.')[0]
            for file in os.listdir(download_path):
                if file.startswith(file_id_base):
                    similar_files.append(file)
        
        return {
            "file_id": file_id,
            "file_path": file_path,
            "exists": os.path.exists(file_path),
            "similar_files": similar_files,
            "in_registry": file_id in FileManager._file_registry
        }
    except Exception as e:
        logger.error(f"Error checking file: {str(e)}")
        return {
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    # Run the application with uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 