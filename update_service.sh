#!/bin/bash
set -e

echo "👨‍💻 YouTube Service dosyasını cookie desteği için güncelliyorum..."

cat > new_backend/app/services/youtube_service.py.new << 'EOFSERVICE'
import os
import asyncio
import tempfile
import re
import uuid
import random
import string
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import logging

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
    
    # Cookie dosya yolu
    COOKIES_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "youtube_cookies.txt")
    
    @staticmethod
    def _get_random_visitor_data():
        """Generate a random-looking visitor data string"""
        # This is just a simple approximation of visitor data format
        base = "".join(random.choices(string.ascii_letters + string.digits, k=12))
        return f"Cgt{base}iO{random.randint(100000, 999999)}Bg%3D%3D"
    
    @staticmethod
    def _get_multiple_user_agents():
        """Return a list of common user agents to rotate through"""
        return [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:94.0) Gecko/20100101 Firefox/94.0',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
        ]
    
    @staticmethod
    def _get_yt_dlp_options(options: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Get default yt-dlp options with any additional options merged
        
        Args:
            options: Additional options to merge with defaults
            
        Returns:
            Dict of yt-dlp options
        """
        # Cookie dosya yolu
        cookies_file = YouTubeService.COOKIES_FILE
        
        # Generate random visitor data
        visitor_data = YouTubeService._get_random_visitor_data()
        
        # Select a random user agent
        user_agent = random.choice(YouTubeService._get_multiple_user_agents())
        
        # Default options to avoid throttling
        default_options = {
            'quiet': True,
            'no_warnings': True,
            'nocheckcertificate': True,
            'geo_bypass': True,
            'geo_bypass_country': 'US',
            'extractor_retries': 5,
            'ignore_no_formats_error': True,
            'format_sort': ['res', 'quality', 'fps', 'hdr:12', 'vcodec:vp9.2', 'vcodec'],
            
            # Cookie dosyasını kullan (eğer mevcutsa)
            'cookiefile': cookies_file if os.path.exists(cookies_file) and os.path.getsize(cookies_file) > 0 else None,
            
            # Various anti-throttling techniques
            'sleep_interval': 1,  # Small delay between requests
            'max_sleep_interval': 5,
            'extractor_args': {
                'youtubetab': {
                    'skip': ['webpage'],
                },
                'youtube': {
                    'player_skip': ['webpage', 'configs', 'js'],
                    'skip': ['hls', 'dash', 'translated_subs'],
                    'visitor_data': [visitor_data],
                    'comment_threads': ['0']
                }
            },
            
            # Browser-like headers to avoid detection
            'http_headers': {
                'User-Agent': user_agent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.google.com/',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-User': '?1',
                'TE': 'trailers'
            }
        }
        
        # None değerlerini temizle
        if default_options.get('cookiefile') is None:
            default_options.pop('cookiefile', None)
        
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
                logger.info(f"Fetching video info for {url}")
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
            
            # Try with a different set of options if the first attempt fails
            try:
                # Fallback options with more aggressive bypassing
                fallback_options = cls._get_yt_dlp_options({
                    'format': 'best',
                    'simulate': True,
                    'dump_single_json': True,
                    'skip_download': True,
                    'youtube_include_dash_manifest': False,
                    'youtube_include_hls_manifest': False,
                })
                
                logger.info(f"Retrying with fallback options for {url}")
                with yt_dlp.YoutubeDL(fallback_options) as ydl:
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
                
            except Exception as fallback_error:
                logger.error(f"Fallback method also failed: {str(fallback_error)}")
                raise ValueError(f"Failed to extract video info even with fallback method. Try again later or with a different video.")
                
        except Exception as e:
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
            output_template = f"{safe_title}.{output_ext}"
        else:
            # For video, prefer mp4 with h264 codec for maximum compatibility
            if format_id:
                # User selected a specific format
                format_spec = f"{format_id}+bestaudio/best"
            else:
                # Prefer MP4 with H.264 video codec and AAC audio for maximum compatibility
                format_spec = 'bestvideo[ext=mp4][vcodec^=avc][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]/best[height<=1080]'
            
            output_ext = 'mp4'
            output_template = f"{safe_title}.{output_ext}"
        
        unique_filename = f"{unique_id}.{output_ext}"
        
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
                
                # Try with a fallback approach if first download failed
                logger.info("Trying fallback download approach...")
                
                # Different options for fallback
                fallback_options = cls._get_yt_dlp_options({
                    'format': 'best' if audio_only else 'best[height<=1080]',
                    'outtmpl': output_path,
                    'postprocessors': postprocessors,
                    'noplaylist': True,
                    'merge_output_format': 'mp4',
                })
                
                with yt_dlp.YoutubeDL(fallback_options) as ydl:
                    await loop.run_in_executor(None, ydl.download, [url])
                
                # Search for files that might have been created with a different naming pattern
                if not os.path.exists(output_path):
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
EOFSERVICE

# YouTube service dosyasını güncelle
if [ -f "new_backend/app/services/youtube_service.py.new" ]; then
    cp new_backend/app/services/youtube_service.py.new new_backend/app/services/youtube_service.py
    echo "✅ YouTube Service dosyası başarıyla güncellendi!"
else
    echo "❌ YouTube Service dosyası oluşturulamadı!"
    exit 1
fi

# Cookie dönüştürücü script'i oluştur
mkdir -p new_backend/app/data
cat > new_backend/app/data/cookie_converter.py << 'EOFCONVERTER'
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import time
import os

def process_chrome_cookies(input_file, output_file):
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        with open(output_file, 'w', encoding='utf-8') as f:
            # Netscape cookie formatı başlığı
            f.write("# Netscape HTTP Cookie File\n")
            f.write("# https://curl.haxx.se/docs/http-cookies.html\n")
            f.write("# This file was generated by cookie_converter.py\n\n")
            
            # Her satırı işle
            for line in lines:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                
                parts = line.split('\t')
                if len(parts) >= 5:
                    try:
                        name = parts[0]
                        value = parts[1]
                        domain = parts[2]
                        path = parts[3]
                        expiry = int(time.time()) + 86400*30  # 30 gün
                        secure = "TRUE" if "TRUE" in line.upper() or "SECURE" in line.upper() else "FALSE"
                        
                        # Domain'i düzelt
                        if not domain.startswith('.') and '.' in domain:
                            domain = '.' + domain
                        
                        # Netscape formatı: domain TAB flag TAB path TAB secure TAB expiry TAB name TAB value
                        f.write(f"{domain}\tTRUE\t{path}\t{secure}\t{expiry}\t{name}\t{value}\n")
                    except Exception as e:
                        sys.stderr.write(f"Satır işlenirken hata: {line} - {str(e)}\n")
        
        print(f"✅ Cookie'ler başarıyla {output_file} dosyasına kaydedildi!")
        return True
    except Exception as e:
        print(f"❌ Hata: {str(e)}")
        return False

def main():
    if len(sys.argv) != 2:
        print("""
🍪 Chrome Cookie -> Netscape Format Dönüştürücü 🍪
Kullanım: python cookie_converter.py chrome_cookies.txt

1. Chrome tarayıcınızı açın
2. YouTube'a gidin ve hesabınıza giriş yapın
3. F12 tuşuna basarak Developer Tools'u açın
4. "Application" sekmesine tıklayın
5. Sol tarafta "Storage" > "Cookies" > "https://www.youtube.com" seçin
6. Tüm cookie'leri seçin (Ctrl+A veya ⌘+A) ve kopyalayın
7. chrome_cookies.txt dosyasına yapıştırın
8. Bu scripti çalıştırın: python cookie_converter.py chrome_cookies.txt
""")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "youtube_cookies.txt")
    process_chrome_cookies(input_file, output_file)

if __name__ == "__main__":
    main()
EOFCONVERTER

chmod +x new_backend/app/data/cookie_converter.py
echo "✅ Cookie dönüştürücü script oluşturuldu: new_backend/app/data/cookie_converter.py"

# Docker-compose dosyasını güncelle
echo "📋 Docker-compose dosyasını güncelliyorum..."
if [ -f "docker-compose.yml" ]; then
    # docker-compose.yml dosyasında volume ekle
    sed -i.bak '/backend_downloads/a\\      - ./new_backend/app/data:/app/data' docker-compose.yml
    echo "✅ Docker-compose.yml dosyası güncellendi!"
else
    echo "⚠️ docker-compose.yml dosyası bulunamadı!"
fi

# Git komutlarını hazırla
echo "🌱 Git işlemleri için komutlar hazırlanıyor..."
echo "
👍 Tüm güncellemeler tamamlandı! Şimdi şu komutları çalıştırabilirsiniz:

# Değişiklikleri git'e eklemek için:
git add new_backend/app/services/youtube_service.py new_backend/app/data/cookie_converter.py docker-compose.yml
git commit -m \"YouTube indirme işlemlerini Netscape cookie desteği ile güncelle\"
git push origin main

# Sunucuya bağlanmak için:
ssh kullanici@sunucu

# Sunucuda uygulamak için:
cd ~/youtube
git pull
mkdir -p new_backend/app/data
# Chrome cookie'leri dönüştürün ve new_backend/app/data/youtube_cookies.txt dosyasına kaydedin
docker-compose down
docker-compose up -d

# Veya sadece rebuild_container.sh scriptini çalıştırın:
./rebuild_container.sh
"

echo "🌈 İyi çalışmalar!"
