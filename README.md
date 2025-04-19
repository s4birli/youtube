# YouTube Downloader

A modern YouTube video and audio downloader built with TypeScript, Express, and youtube-dl-exec.

![License](https://img.shields.io/github/license/s4birli/youtube)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/s4birli/youtube/main.yml?branch=main)

## Features

- 🎬 Download YouTube videos in various formats and qualities
- 🎵 Extract audio from YouTube videos
- ⚡ Fast downloads using youtube-dl-exec
- 🔒 No user data storage or tracking
- 🌐 Cross-platform compatibility

## Tech Stack

### Backend
- 🚀 Node.js and Express with TypeScript
- 🎥 youtube-dl-exec for YouTube video processing
- 🧪 Jest for testing

### Deployment
- 🐳 Docker for containerization
- 🔄 GitHub Actions for CI/CD

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3 (for youtube-dl-exec)
- ffmpeg (for audio conversion)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/s4birli/youtube.git
cd youtube
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

3. Configure environment:
```bash
# Backend
cp backend/.env.example backend/.env
```

4. Start development servers:
```bash
# Start from the root
npm run dev

# Or start from the backend directory
cd backend
npm run dev
```

5. Open your browser and navigate to http://localhost:3000

## Project Structure

```
youtube/
├── .github/           # GitHub Actions workflows and templates
├── backend/           # Express backend application
│   ├── src/           # Source code
│   ├── tests/         # Test files
│   ├── data/          # Downloaded files
│   └── ...
└── README.md          # This file
```

## Development

### Running Tests

```bash
# Run all tests from root
npm test

# Run backend tests
cd backend
npm test
```

### Linting

```bash
# Lint from root
npm run lint

# Lint backend
cd backend
npm run lint
```

### Building for Production

```bash
# Build from root
npm run build

# Build backend
cd backend
npm run build
```

## Deployment with Docker

The application can be easily deployed using Docker:

```bash
cd backend
docker-compose up -d
```

This will start the application on port 3000.

## API Documentation

The backend API provides the following endpoints:

- `POST /api/youtube/info` - Get video information
- `POST /api/youtube/download` - Download video or audio
- `GET /api/health` - Check API health

See the [backend README](backend/README.md) for more details.

## License

This project is licensed under the MIT License.

---

Made with ❤️ by Mehmet Sabirli

# YouTube Downloader API - Deployment

This repository contains a Python FastAPI application for downloading YouTube videos and audio streams.

## Quick Deployment

To deploy the application, run:

```bash
./deploy.sh
```

This script will:
1. Pull the latest code if in a git repository
2. Install dependencies if Python/pip are available locally
3. Create the downloads directory
4. Build and start the Docker container
5. Clean up unused Docker images

## Manual Deployment

If you prefer to deploy manually:

1. Ensure Docker and Docker Compose are installed
2. Build the Docker image:
   ```bash
   docker-compose build
   ```
3. Start the container:
   ```bash
   docker-compose up -d
   ```

## Accessing the API

- API Base URL: http://84.8.157.166/api/v1
- API Documentation: http://84.8.157.166/api/v1/docs

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/youtube/info` | POST | Get video information and available formats |
| `/api/v1/youtube/download` | POST | Download video in specified format |
| `/api/v1/youtube/download/{file_id}` | GET | Download a previously processed file |
| `/api/v1/youtube/health` | GET | Health check endpoint |

## Environment Variables

The following environment variables can be configured in docker-compose.yml:

| Variable | Description | Default |
|----------|-------------|---------|
| API_V1_STR | API base path | /api/v1 |
| PROJECT_NAME | Project name | YouTube Downloader API |
| DOWNLOAD_PATH | Directory for downloaded files | /app/downloads |
| FILE_EXPIRY_SECONDS | How long files are kept (seconds) | 300 |
| MAX_RESOLUTION | Maximum video resolution | 1080p |
| DEBUG | Debug mode | false |

## Maintenance

- View container logs: `docker-compose logs -f`
- Restart container: `docker-compose restart`
- Stop container: `docker-compose down`
- Update and redeploy: Run `./deploy.sh` again