# YouTube Downloader Backend

A Node.js application for downloading YouTube videos using TypeScript, Express, and youtube-dl-exec.

## Features

- Download YouTube videos in various formats and qualities
- Extract audio from YouTube videos
- RESTful API for integration with other applications
- Docker containerization for easy deployment

## Prerequisites

- Node.js 18+ and npm
- Python 3 (required for youtube-dl-exec)
- ffmpeg (for audio conversion)
- Docker and Docker Compose (for containerization)

## Installation

### Local Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/s4birli/youtube.git
   cd youtube/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a .env file:
   ```
   cp .env.example .env
   ```

4. Run the development server:
   ```
   npm run dev
   ```

### Using Docker

1. Build and start the Docker container:
   ```
   docker-compose up -d
   ```

2. Stop the container:
   ```
   docker-compose down
   ```

## API Endpoints

### Get Video Information

```
POST /api/youtube/info
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

### Download Video

```
POST /api/youtube/download
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "format": "mp4",
  "quality": "high"
}
```

### Health Check

```
GET /api/health
```

## Scripts

- `npm run build` - Build the TypeScript files
- `npm run start` - Start the production server
- `npm run dev` - Start the development server with hot reload
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## Project Structure

```
backend/
├── src/                 # Source code
│   ├── config/          # Configuration files
│   ├── controllers/     # API controllers
│   ├── middlewares/     # Express middlewares
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── interfaces/      # TypeScript interfaces
│   ├── app.ts           # Express application setup
│   └── index.ts         # Application entry point
├── tests/               # Test files
├── data/                # Downloaded files directory
├── .env.example         # Environment variables example
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose configuration
└── README.md            # This file
```

## License

MIT 