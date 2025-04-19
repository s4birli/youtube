# YouTube Downloader API

A Python-based backend API using FastAPI to download YouTube videos and audio streams.

## Features

- Extract YouTube video information including available quality options
- Download videos in selected quality (max 1080p)
- Download audio-only streams in MP3 format
- Temporary file storage with automatic cleanup (5-minute expiry)
- Docker support for easy deployment

## Technical Stack

- Python 3.11+
- FastAPI
- yt-dlp (for YouTube media extraction)
- FFmpeg (for media processing)
- Docker for containerization

## Installation and Setup

### Local Development Setup

1. Clone the repository
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Make sure FFmpeg is installed on your system
5. Copy the example environment file and adjust as needed:
   ```bash
   cp .env.example .env
   ```
6. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Using Docker

1. Build the Docker image:
   ```bash
   docker build -t youtube-downloader-api .
   ```
2. Run the container:
   ```bash
   docker run -p 8000:8000 youtube-downloader-api
   ```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/youtube/info` | POST | Get video information and available formats |
| `/api/v1/youtube/download` | POST | Download video in specified format |
| `/api/v1/download/{file_id}` | GET | Download a previously processed file |
| `/api/v1/youtube/health` | GET | Health check endpoint |

## API Usage Examples

### Get Video Information

```bash
curl -X POST "http://localhost:8000/api/v1/youtube/info" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### Download Video

```bash
curl -X POST "http://localhost:8000/api/v1/youtube/download" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "format_id": "22"}'
```

### Download Audio Only

```bash
curl -X POST "http://localhost:8000/api/v1/youtube/download" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "audio_only": true}'
```

## Legal Disclaimer

This tool is provided for educational purposes only. Users are responsible for ensuring they have the right to download and use content according to YouTube's terms of service. Downloaded content is only stored temporarily (5 minutes) and is not shared or distributed in any way.

## Future Enhancements

- Add support for YouTube playlists
- Implement IP-based download limits
- Add analytics and logging
- Integrate with a frontend UI (React, Vue, etc.)