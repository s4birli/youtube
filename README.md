# YouTube Video Downloader

A FastAPI-based backend service for downloading YouTube videos with anti-throttling measures.

## Features

- Download YouTube videos in various resolutions (up to 1080p)
- Download audio-only in MP3 format
- Advanced anti-throttling measures to bypass YouTube's bot detection
- Proper cookie handling for authenticated requests
- Temporary file storage with automatic cleanup

## Requirements

- Python 3.8+
- Docker (optional for containerized deployment)
- FFmpeg
- yt-dlp

## Setup & Installation

### Local Development

1. Clone the repository
2. Install dependencies:
```bash
pip install -r new_backend/requirements.txt
```
3. Set up YouTube cookies:
```bash
cd new_backend
python -m app.data.get_cookies
```
   - This script attempts to extract YouTube cookies from your browsers
   - Make sure you're logged into YouTube in at least one browser
   - If the script cannot find cookies, you may need to manually create a cookies file

4. Run the application:
```bash
cd new_backend
uvicorn app.main:app --reload
```

### Using Docker

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

## Handling YouTube Bot Detection

YouTube has increasingly aggressive bot detection mechanisms. This application implements various methods to bypass these:

1. **Cookie-based authentication**:
   - The application extracts cookies from your browser to authenticate with YouTube
   - To update cookies manually, run: `python -m app.data.get_cookies`
   - If you cannot extract cookies automatically, you can manually export cookies:
     - Install a browser extension like "Get cookies.txt" 
     - Visit YouTube and log in
     - Export cookies to `new_backend/app/data/youtube_cookies.txt`

2. **Browser Fingerprinting Bypass**:
   - Random visitor data generation
   - Rotating user agents
   - Proper HTTP headers

3. **Multiple Fallback Methods**:
   - If a method fails, the application tries alternative approaches

## API Endpoints

- `GET /api/v1/youtube/info?url={youtube_url}` - Get video information
- `GET /api/v1/youtube/download?url={youtube_url}&format_id={format_id}` - Download video
- `GET /api/v1/youtube/download-audio?url={youtube_url}` - Download audio only
- `GET /api/v1/youtube/health` - Health check endpoint

For more details, visit the Swagger documentation at `/api/v1/docs` when the server is running.

## Troubleshooting

If you encounter the "Sign in to confirm you're not a bot" error:

1. Make sure you have valid cookies:
   - Run the cookie extraction script or manually export cookies
   - Verify you're logged into YouTube in your browser
   - If using an incognito window, note that cookies won't persist

2. Try different browsers:
   - Different browsers have different cookie storage mechanisms
   - Chrome and Firefox generally work best with yt-dlp

3. Update yt-dlp:
   - `pip install -U yt-dlp`
   - The library is frequently updated to handle YouTube's changes

## License

MIT License