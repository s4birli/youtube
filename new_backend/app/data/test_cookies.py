#!/usr/bin/env python3
import os
import sys
import yt_dlp
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Try to import the PO token plugin
try:
    import yt_dlp_get_pot
    from bgutil_ytdlp_pot_provider import BgutilPotProvider
    logger.info("PO Token plugin available")
    
    # Set up the provider
    provider = BgutilPotProvider(
        server_url="http://127.0.0.1:4416",
        debug=True
    )
    yt_dlp_get_pot.register(provider)
    logger.info("PO Token provider registered")
except ImportError:
    logger.warning("PO Token plugin not available")

# Path to the cookies file
script_dir = os.path.dirname(os.path.abspath(__file__))
cookies_file = os.path.join(script_dir, "netscape_cookies.txt")

if not os.path.exists(cookies_file):
    logger.error(f"Cookies file not found: {cookies_file}")
    sys.exit(1)

logger.info(f"Using cookies file: {cookies_file}")
logger.info(f"File size: {os.path.getsize(cookies_file)} bytes")

# Test URL
url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Create yt-dlp options
ydl_opts = {
    'quiet': False,
    'verbose': True,
    'format': 'best[height<=360]',  # Use a lower resolution for testing
    'cookiefile': cookies_file,
    'dump_single_json': True,
    'force_generic_extractor': False,
    'extractor_args': {
        'youtube': {
            'player_client': ['web', 'tv', 'tv_embedded', 'web_embedded'],
            'skip': []
        }
    }
}

# Try to get video info
logger.info(f"Attempting to get info for: {url}")
try:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        logger.info(f"Successfully retrieved info: {info.get('title')}")
        logger.info(f"Duration: {info.get('duration')} seconds")
        logger.info(f"Available formats: {len(info.get('formats', []))}")
except Exception as e:
    logger.error(f"Error extracting info: {str(e)}")

# Test with web client + PO token
logger.info("Testing web client with PO token...")
ydl_opts['extractor_args']['youtube']['player_client'] = ['web']
try:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        logger.info(f"Success with web client: {info.get('title')}")
except Exception as e:
    logger.error(f"Error with web client: {str(e)}")

# Test downloading a short clip
logger.info("Testing download...")
try:
    ydl_opts['format'] = 'worst'  # Use worst format for quick test
    ydl_opts['outtmpl'] = os.path.join(script_dir, 'test_download.%(ext)s')
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    logger.info("Download successful!")
except Exception as e:
    logger.error(f"Error downloading: {str(e)}")

logger.info("Test complete!") 