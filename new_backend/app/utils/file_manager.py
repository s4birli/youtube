import os
import time
import uuid
import asyncio
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import BackgroundTasks
from fastapi.responses import FileResponse

from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)


class FileManager:
    """
    Manages temporary files for YouTube downloads
    Handles file creation, cleanup, and tracking
    """
    # Store file metadata with expiry times
    _file_registry: Dict[str, Dict] = {}
    
    @classmethod
    def list_all_files(cls) -> List[str]:
        """List all files in the download directory"""
        try:
            download_path = Path(settings.DOWNLOAD_PATH)
            files = list(download_path.glob("*"))
            return [str(f) for f in files]
        except Exception as e:
            logger.error(f"Error listing files: {str(e)}")
            return []
    
    @classmethod
    def generate_unique_filename(cls, original_filename: str, extension: str = None) -> str:
        """Generate a unique filename with optional extension"""
        if extension and not extension.startswith('.'):
            extension = f".{extension}"
            
        filename = f"{uuid.uuid4().hex}"
        if extension:
            filename = f"{filename}{extension}"
        return filename
    
    @classmethod
    def get_file_path(cls, filename: str) -> Path:
        """Get the full path for a file in the download directory"""
        return Path(settings.DOWNLOAD_PATH) / filename
    
    @classmethod
    def register_file(cls, filename: str, original_filename: str, file_type: str) -> Dict:
        """
        Register a file in the registry with metadata
        Returns file metadata including expiry time
        """
        file_path = cls.get_file_path(filename)
        expiry_time = datetime.now() + timedelta(seconds=settings.FILE_EXPIRY_SECONDS)
        
        # Ensure the download directory exists
        os.makedirs(settings.DOWNLOAD_PATH, exist_ok=True)
        
        # Verify file exists before registering
        if not file_path.exists():
            logger.error(f"Cannot register non-existent file: {file_path}")
            
            # Try to find a similar file
            similar_files = list(Path(settings.DOWNLOAD_PATH).glob(f"{filename.split('.')[0]}*"))
            if similar_files:
                file_path = similar_files[0]
                filename = file_path.name
                logger.info(f"Found similar file to register instead: {file_path}")
            else:
                logger.error(f"No similar files found in {settings.DOWNLOAD_PATH}")
                all_files = os.listdir(settings.DOWNLOAD_PATH)
                logger.info(f"All files in directory: {all_files}")
                raise FileNotFoundError(f"File {file_path} does not exist")
        
        file_info = {
            "id": filename,
            "original_filename": original_filename,
            "path": str(file_path),
            "created_at": datetime.now().isoformat(),
            "expires_at": expiry_time.isoformat(),
            "type": file_type,  # 'video' or 'audio'
            "download_url": f"/api/v1/youtube/download/{filename}" 
        }
        
        cls._file_registry[filename] = file_info
        logger.info(f"File registered: {filename}, path: {file_path}, exists: {file_path.exists()}, expires: {expiry_time.isoformat()}")
        return file_info
    
    @classmethod
    def get_file_info(cls, file_id: str) -> Optional[Dict]:
        """Get file information from registry if it exists and hasn't expired"""
        # Debug information
        logger.info(f"Looking for file with ID: {file_id}")
        logger.info(f"Current registry: {list(cls._file_registry.keys())}")
        
        # Extract just the filename without extension for more flexible matching
        file_id_base = file_id.split('.')[0] if '.' in file_id else file_id
        
        # Try to find the file by ID or by base name
        file_info = None
        for key, info in cls._file_registry.items():
            key_base = key.split('.')[0] if '.' in key else key
            if key == file_id or key_base == file_id_base:
                file_info = info
                break
        
        if not file_info:
            logger.warning(f"File not found in registry: {file_id}")
            # Check if file exists on disk even if not in registry
            potential_path = cls.get_file_path(file_id)
            if potential_path.exists():
                logger.info(f"File exists on disk but not in registry: {potential_path}")
                return {
                    "id": file_id,
                    "original_filename": file_id,
                    "path": str(potential_path),
                    "type": "unknown"
                }
            return None
            
        # Check if file has expired
        expiry_time = datetime.fromisoformat(file_info["expires_at"])
        if datetime.now() > expiry_time:
            # File has expired
            logger.warning(f"File has expired: {file_id}, expiry: {expiry_time.isoformat()}")
            cls.remove_file(file_id)
            return None
        
        # Check if file exists on disk
        file_path = Path(file_info["path"])
        if not file_path.exists():
            logger.warning(f"File not found on disk: {file_path}")
            cls.remove_file(file_id)
            return None
            
        logger.info(f"File found and valid: {file_id}")
        return file_info
    
    @classmethod
    def remove_file(cls, file_id: str) -> bool:
        """Remove a file and its entry from the registry"""
        file_info = cls._file_registry.pop(file_id, None)
        if not file_info:
            logger.warning(f"Attempted to remove non-existent file: {file_id}")
            return False
            
        try:
            file_path = Path(file_info["path"])
            if file_path.exists():
                file_path.unlink()
                logger.info(f"File deleted: {file_path}")
            return True
        except Exception as e:
            logger.error(f"Error removing file: {file_id}, error: {str(e)}")
            return False
    
    @classmethod
    async def cleanup_expired_files(cls) -> None:
        """Clean up expired files (to be run as a background task)"""
        # Get current timestamp
        now = datetime.now()
        
        # Find expired files
        expired_ids = []
        for file_id, file_info in cls._file_registry.items():
            expiry_time = datetime.fromisoformat(file_info["expires_at"])
            if now > expiry_time:
                expired_ids.append(file_id)
        
        # Remove expired files
        for file_id in expired_ids:
            cls.remove_file(file_id)
    
    @classmethod
    def schedule_cleanup(cls, background_tasks: BackgroundTasks) -> None:
        """Schedule cleanup as a background task"""
        background_tasks.add_task(cls.cleanup_expired_files)
    
    @classmethod
    def serve_file(cls, file_id: str) -> Optional[FileResponse]:
        """Serve a file if it exists and hasn't expired"""
        logger.info(f"Attempting to serve file: {file_id}")
        
        # First check registry
        file_info = cls.get_file_info(file_id)
        
        if not file_info:
            # If not in registry, try direct file lookup
            direct_path = cls.get_file_path(file_id)
            if direct_path.exists():
                logger.info(f"File found via direct path: {direct_path}")
                return FileResponse(
                    path=direct_path,
                    filename=file_id,
                    media_type="application/octet-stream" 
                )
            logger.warning(f"File not found: {file_id}")
            return None
            
        file_path = Path(file_info["path"])
        if not file_path.exists():
            logger.warning(f"File path does not exist: {file_path}")
            cls.remove_file(file_id)
            return None
            
        logger.info(f"Serving file: {file_path}")
        # Determine MIME type based on extension
        media_type = "application/octet-stream"
        if file_path.suffix == '.mp3':
            media_type = "audio/mpeg"
        elif file_path.suffix == '.mp4':
            media_type = "video/mp4"
            
        return FileResponse(
            path=file_path,
            filename=file_info["original_filename"],
            media_type=media_type
        ) 