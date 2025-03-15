# YouTube Downloader

A modern, client-side YouTube video and audio downloader built with TypeScript, React, and FastAPI/NestJS.

![License](https://img.shields.io/github/license/s4birli/youtube)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/s4birli/youtube/ci.yml?branch=main)

## Features

- 🎬 Download YouTube videos in various formats and qualities
- 🎵 Extract audio from YouTube videos
- 📱 Responsive design for desktop and mobile
- ⚡ Fast, client-side downloads without server bandwidth usage
- 🔒 No user data storage or tracking
- 🌐 Cross-platform compatibility

## Demo

[View Live Demo](https://your-project-url.com)

![Screenshot](docs/screenshots/app-screenshot.png)

## Tech Stack

### Frontend
- ⚛️ React with TypeScript
- 🎨 Tailwind CSS for styling
- 📦 Vite for bundling
- 🧪 Vitest for testing

### Backend
- 🚀 NestJS or FastAPI with TypeScript
- 🎥 yt-dlp for YouTube video processing
- 🧪 Jest for testing

### Deployment
- ☁️ Oracle Cloud Always Free tier
- 🌐 Nginx for web serving
- 🔄 GitHub Actions for CI/CD

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

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

# Install frontend dependencies
cd frontend
npm install
cd ..
```

3. Configure environment:
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

4. Start development servers:
```bash
# Start both frontend and backend concurrently
npm run dev

# Or start individually
npm run dev:backend
npm run dev:frontend
```

5. Open your browser and navigate to http://localhost:3000

## Project Structure

```
youtube-downloader/
├── .github/           # GitHub Actions workflows and templates
├── backend/           # NestJS/FastAPI backend application
│   ├── src/           # Source code
│   ├── test/          # Test files
│   └── ...
├── frontend/          # React frontend application
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   └── ...
├── scripts/           # Utility scripts
├── docs/              # Documentation
└── README.md          # This file
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend
```

### Linting

```bash
# Lint all code
npm run lint

# Lint backend
npm run lint:backend

# Lint frontend
npm run lint:frontend
```

### Building for Production

```bash
# Build both frontend and backend
npm run build

# Build backend only
npm run build:backend

# Build frontend only
npm run build:frontend
```

## Deployment

The application is designed to be deployed on Oracle Cloud Always Free tier, but can be deployed to any cloud provider that supports Node.js applications.

See our [Deployment Guide](docs/deployment.md) for detailed instructions.

## API Documentation

The backend API provides the following endpoints:

- `GET /api/videos/info?url={youtube_url}` - Get video information and available formats
- `GET /api/videos/download?url={youtube_url}&format={format_id}` - Download video in specified format
- `GET /api/videos/audio?url={youtube_url}` - Extract audio from video

See our [API Documentation](docs/api.md) for more details.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and suggest features.

### Branching Strategy

We use a simplified Git Flow approach:

- `main` - Production branch
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Hot fix branches
- `release/*` - Release branches

See our [GitHub Workflow Guide](docs/github-workflow.md) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - The YouTube download library powering this application
- [NestJS](https://nestjs.com/) - The backend framework
- [React](https://reactjs.org/) - The frontend library
- [Tailwind CSS](https://tailwindcss.com/) - The CSS framework
- [Oracle Cloud](https://www.oracle.com/cloud/) - Hosting provider with generous free tier

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/yourusername/youtube-downloader/issues/new/choose) on GitHub.

---

Made with ❤️ by Mehmet Sabirli