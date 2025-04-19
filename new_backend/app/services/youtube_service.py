import os
import asyncio
import tempfile
import re
from typing import Dict, List, Optional, Tuple, Any
import logging
import uuid
from pathlib import Path

import yt_dlp
import ffmpeg

from app.core.config import settings
from app.utils.file_manager import FileManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class YouTubeService:
    """
    Service for handling YouTube video operations:
    - Extracting video information
    - Downloading videos in specified quality
    - Processing audio/video streams
    """
    
    @staticmethod
    def _get_yt_dlp_options(options: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Get default yt-dlp options with any additional options merged
        
        Args:
            options: Additional options to merge with defaults
            
        Returns:
            Dict of yt-dlp options
        """
        # Default values for visitor data approach
        VISITOR_DATA = "CgtTSzFGVndwTjJvayiO6LCcBg%3D%3D"
        EXTRACTOR_ARGS = {
            'youtubetab': {'skip': ['webpage']},
            'youtube': {
                'player_skip': ['webpage', 'configs'],
                'visitor_data': [VISITOR_DATA]
            }
        }
        
        # Default options to avoid throttling and mimic browser behavior
        default_options = {
            'quiet': True,
            'no_warnings': True,
            'nocheckcertificate': True,
        }
        
        # Force visitor data approach (no cookies)
        logger.info("Using visitor data approach (no cookies)")
        default_options['extractor_args'] = EXTRACTOR_ARGS
        
        # Add browser-like headers to avoid detection
        default_options['http_headers'] = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                        '(KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
        }
        
        # Merge with provided options
        if options:
            # Special handling for extractor_args to merge them properly
            if 'extractor_args' in options and 'extractor_args' in default_options:
                for extractor, args in options['extractor_args'].items():
                    if extractor in default_options['extractor_args']:
                        default_options['extractor_args'][extractor].update(args)
                    else:
                        default_options['extractor_args'][extractor] = args
                del options['extractor_args']
            
            default_options.update(options)
            
        return default_options
    
    @staticmethod
    def validate_youtube_url(url: str) -> bool:
        """
        Validate if the URL is a valid YouTube URL
        
        Args:
            url: The URL to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        # Simple regex pattern to match YouTube URLs
        youtube_pattern = r'(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([^\s&]+)'
        return bool(re.match(youtube_pattern, url))
    
    @classmethod
    async def get_video_info(cls, url: str) -> Dict:
        """
        Get information about a YouTube video
        
        Args:
            url: YouTube video URL
            
        Returns:
            Dict containing video information
        """
        if not cls.validate_youtube_url(url):
            raise ValueError("Invalid YouTube URL")
            
        # Use yt-dlp to extract video information
        options = cls._get_yt_dlp_options({
            'format': 'bestvideo[height<=1080]+bestaudio/best[height<=1080]',
            'simulate': True,
            'dump_single_json': True,
        })
        
        try:
            loop = asyncio.get_event_loop()
            with yt_dlp.YoutubeDL(options) as ydl:
                # Run yt-dlp info extraction in a separate thread to avoid blocking
                info = await loop.run_in_executor(None, ydl.extract_info, url, False)
                
            # Filter and format the info
            formats = cls._filter_formats(info.get('formats', []))
            
            # Prepare response with required video information
            video_info = {
                'id': info.get('id'),
                'title': info.get('title'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration'),
                'uploader': info.get('uploader'),
                'formats': formats,
                'has_audio_only': any(f.get('acodec') != 'none' and f.get('vcodec') == 'none' for f in info.get('formats', [])),
            }
            
            return video_info
            
        except yt_dlp.utils.DownloadError as e:
            logger.error(f"Error extracting video info: {str(e)}")
            raise ValueError(f"Failed to extract video info: {str(e)}")
    
    @staticmethod
    def _filter_formats(formats: List[Dict]) -> List[Dict]:
        """
        Filter and format the video format information to include only needed formats
        
        Args:
            formats: List of format dictionaries from yt-dlp
            
        Returns:
            List of filtered format dictionaries
        """
        # Filter out formats based on our supported qualities
        max_height = int(settings.MAX_RESOLUTION.replace('p', ''))
        supported_heights = [int(q.replace('p', '')) for q in settings.SUPPORTED_QUALITIES]
        
        filtered_formats = []
        
        # Group formats by resolution
        resolution_formats = {}
        
        for fmt in formats:
            # Skip audio-only formats from the main list
            if fmt.get('vcodec') == 'none':
                continue
                
            # Extract height and ensure it's an integer
            try:
                height = fmt.get('height')
                if height is None:
                    continue
                
                height = int(height)  # Convert to int to ensure proper comparison
                
                # Skip formats higher than our max resolution
                if height > max_height:
                    continue
                    
                # Find closest supported resolution
                closest_height = min(supported_heights, key=lambda x: abs(x - height))
                
                # Use this as the displayed resolution
                display_resolution = f"{closest_height}p"
                
                # Skip if we already have a better format for this resolution
                if display_resolution in resolution_formats:
                    existing_fmt = resolution_formats[display_resolution]
                    # Prefer better quality at same resolution if available
                    if fmt.get('filesize', 0) and existing_fmt.get('filesize', 0):
                        if fmt.get('filesize', 0) > existing_fmt.get('filesize', 0):
                            resolution_formats[display_resolution] = fmt
                else:
                    resolution_formats[display_resolution] = fmt
            except (TypeError, ValueError):
                # Skip any format that causes type or value errors during processing
                logger.warning(f"Skipping format with invalid height: {fmt.get('format_id')}")
                continue
        
        # Convert the dictionary to a list
        for resolution, fmt in resolution_formats.items():
            # Add a simplified format entry
            filtered_formats.append({
                'format_id': fmt.get('format_id'),
                'resolution': resolution,
                'fps': fmt.get('fps'),
                'filesize': fmt.get('filesize'),
                'ext': fmt.get('ext'),
                'vcodec': fmt.get('vcodec'),
                'acodec': fmt.get('acodec'),
            })
        
        # Sort by resolution (height)
        filtered_formats.sort(
            key=lambda x: int(x['resolution'].replace('p', '')), 
            reverse=True
        )
        
        return filtered_formats
    
    @classmethod
    async def download_video(cls, url: str, format_id: Optional[str] = None, audio_only: bool = False) -> Dict:
        """
        Download a YouTube video with the specified format
        
        Args:
            url: YouTube video URL
            format_id: Optional format ID to download specific quality
            audio_only: If True, download audio only
            
        Returns:
            Dict with file information
        """
        if not cls.validate_youtube_url(url):
            raise ValueError("Invalid YouTube URL")
        
        # First get video info to get title and validate format
        video_info = await cls.get_video_info(url)
        video_title = video_info.get('title', 'video')
        
        # Sanitize filename
        safe_title = re.sub(r'[^\w\-_\. ]', '', video_title).strip()
        if not safe_title:
            safe_title = "youtube_video"
        
        # Generate unique filename for temporary download
        unique_id = uuid.uuid4().hex
        
        # Determine format and extension
        if audio_only:
            # Audio-only format
            format_spec = 'bestaudio/best'
            output_ext = 'mp3'
        else:
            # For video, prefer mp4 with h264 codec for maximum compatibility
            if format_id:
                # User selected a specific format
                format_spec = f"{format_id}+bestaudio/best"
            else:
                # Prefer MP4 with H.264 video codec and AAC audio for maximum compatibility
                format_spec = 'bestvideo[ext=mp4][vcodec^=avc][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]/best[height<=1080]'
            
            output_ext = 'mp4'
        
        unique_filename = f"{unique_id}.{output_ext}"
        output_template = f"{safe_title}.{output_ext}"
        
        # Ensure the download directory exists
        os.makedirs(settings.DOWNLOAD_PATH, exist_ok=True)
        
        # Get the absolute path
        output_path = str(Path(settings.DOWNLOAD_PATH) / unique_filename)
        
        logger.info(f"Download directory: {settings.DOWNLOAD_PATH}")
        logger.info(f"Output path: {output_path}")
        
        # Set up special options for audio downloads
        postprocessors = []
        if audio_only:
            postprocessors.append({
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            })
            # Add file movement post-processor to ensure output is named correctly
            postprocessors.append({
                'key': 'FFmpegMetadata',
                'add_metadata': True,
            })
        else:
            # For video, ensure we remux to MP4 container
            postprocessors.append({
                'key': 'FFmpegVideoRemuxer',
                'preferedformat': 'mp4',
            })
        
        # Set up yt-dlp options for download
        options = cls._get_yt_dlp_options({
            'format': format_spec,
            'outtmpl': output_path,
            'noplaylist': True, 
            'writethumbnail': False,
            'merge_output_format': 'mp4',  # Force MP4 as output container
            'postprocessors': postprocessors,
        })
        
        try:
            logger.info(f"Downloading video: {video_title}")
            
            # Run download in executor to avoid blocking
            loop = asyncio.get_event_loop()
            with yt_dlp.YoutubeDL(options) as ydl:
                await loop.run_in_executor(None, ydl.download, [url])
            
            # Verify file exists
            if not os.path.exists(output_path):
                logger.error(f"File not found after download: {output_path}")
                
                # Search for files that might have been created with a different naming pattern
                download_dir = Path(settings.DOWNLOAD_PATH)
                found_files = list(download_dir.glob(f"{unique_id}*"))
                
                if found_files:
                    # Use the first file that matches the pattern
                    actual_file = str(found_files[0])
                    logger.info(f"Found alternative file: {actual_file}")
                    # If the file has a different extension, update the filename
                    unique_filename = os.path.basename(actual_file)
                    output_path = actual_file
                    
                    # If it's not an MP4 file, try to convert it
                    if not unique_filename.endswith('.mp4') and not audio_only:
                        try:
                            mp4_filename = f"{unique_id}.mp4"
                            mp4_path = str(Path(settings.DOWNLOAD_PATH) / mp4_filename)
                            
                            logger.info(f"Converting {actual_file} to MP4: {mp4_path}")
                            
                            # Use ffmpeg to convert to MP4
                            (
                                ffmpeg
                                .input(actual_file)
                                .output(mp4_path, vcodec='libx264', acodec='aac', strict='experimental')
                                .run(overwrite_output=True, quiet=True)
                            )
                            
                            # Update path if conversion successful
                            if os.path.exists(mp4_path):
                                unique_filename = mp4_filename
                                output_path = mp4_path
                                logger.info(f"Successfully converted to MP4: {mp4_path}")
                        except Exception as e:
                            logger.error(f"Error converting to MP4: {str(e)}")
                else:
                    # Search for any recently created files
                    all_files = os.listdir(settings.DOWNLOAD_PATH)
                    logger.info(f"All files in download directory: {all_files}")
                    raise ValueError(f"Download failed: No output file found in {settings.DOWNLOAD_PATH}")
            
            # Register the file in file manager
            file_type = 'audio' if audio_only else 'video'
            file_info = FileManager.register_file(
                unique_filename,
                output_template,
                file_type
            )
            
            logger.info(f"Download completed: {output_path}, file exists: {os.path.exists(output_path)}")
            
            # Double check to make sure file exists
            if not os.path.exists(output_path):
                logger.error(f"File still not found after registration: {output_path}")
                raise ValueError("File was not created properly")
            
            return file_info
            
        except Exception as e:
            logger.error(f"Error downloading video: {str(e)}")
            # Clean up any partial downloads
            try:
                if os.path.exists(output_path):
                    os.remove(output_path)
            except Exception as ex:
                logger.error(f"Error cleaning up file: {str(ex)}")
            
            raise ValueError(f"Failed to download video: {str(e)}") 