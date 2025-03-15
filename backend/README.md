# YouTube Downloader Backend

A robust backend service for downloading YouTube videos and extracting audio, built with Fastify and TypeScript.

## Features

- Video information retrieval
- Format listing
- Direct download link generation
- Video downloading
- Audio extraction
- Client-side downloading for reduced server load
- Rate limiting and security features
- Comprehensive error handling
- API documentation with Swagger

## Tech Stack

- **Framework**: Fastify
- **Language**: TypeScript
- **Validation**: Zod + JSON Schema
- **Documentation**: Swagger/OpenAPI
- **Testing**: Vitest
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **YouTube Integration**: youtube-dl-exec (yt-dlp)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker and docker-compose (optional)

### Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

3. Install dependencies:
   
   **Option 1**: Use the installation script (recommended):
   ```bash
   ./install.sh
   ```
   This interactive script will guide you through the installation options.
   
   **Option 2**: Standard installation (with Git hooks setup)
   ```bash
   npm install
   ```
   
   **Option 3**: Install without Husky Git hooks (if you're getting Git-related errors)
   ```bash
   npm run install:no-husky
   ```

4. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
   
5. Start the development server:
   ```bash
   npm run dev
   ```

### Using Docker

To run the application with Docker:

```bash
docker-compose up
```

## API Endpoints

Once the server is running, you can access the API documentation at:
http://localhost:3001/documentation

### Main Endpoints

- `POST /api/youtube/info` - Get video information
- `POST /api/youtube/formats` - Get available formats
- `GET /api/youtube/link/:videoId/:formatId` - Get direct download link
- `POST /api/youtube/download` - Start download process
- `GET /api/youtube/progress/:downloadId` - Check download progress
- `GET /api/youtube/download/:downloadId` - Stream downloaded file

## Development

### Available Scripts

- `npm run dev` - Start development server with hot-reloading
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run linter
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run docs` - Generate API documentation

## Deployment

The application is configured for deployment to Oracle Cloud Infrastructure using GitHub Actions.

## Troubleshooting

### Installation Issues

If you encounter errors related to Husky or Git hooks during installation, use one of these methods:

1. **Interactive Installation Script**: 
   ```bash
   ./install.sh
   ```
   
2. **Skip Git Hooks**:
   ```bash
   npm run install:no-husky
   ```

3. **Fix Husky Directory**: 
   If you're having issues with Husky finding the Git directory, the project is configured to look for Git in the parent directory.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 