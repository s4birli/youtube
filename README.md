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