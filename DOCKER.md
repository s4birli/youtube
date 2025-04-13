# Docker Deployment Guide for YouTube Downloader

This guide explains how to build, run, and deploy the YouTube Downloader application using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Quick Start

To quickly start the application in development mode, run:

```bash
docker-compose up
```

This will:
1. Build the backend and frontend Docker images
2. Start both services
3. Make the application available at http://localhost

## Building and Running

### Build the Docker images

```bash
docker-compose build
```

### Start the services

```bash
docker-compose up -d
```

The `-d` flag runs the containers in the background.

### View logs

```bash
docker-compose logs -f
```

### Stop the services

```bash
docker-compose down
```

## Configuration

### Environment Variables

The application is configured using environment variables:

#### Backend Environment Variables

Edit the `backend/.env` file or pass environment variables to the container:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Port the server listens on | 3000 |
| HOST | Host the server binds to | 0.0.0.0 |
| NODE_ENV | Environment mode | production |
| DOWNLOAD_TEMP_DIR | Directory for temporary downloads | /app/data |
| CORS_ORIGIN | Allowed CORS origins | http://localhost |
| MAX_CONCURRENT_DOWNLOADS | Maximum concurrent downloads | 3 |

#### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost/api |
| VITE_API_BASE_URL | Base URL for direct downloads | http://localhost |

## Docker Volumes

The Docker Compose configuration creates two volumes:

- `backend_data`: Stores downloaded files
- `backend_public`: Stores public files

## Production Deployment

For production deployment, modify the `docker-compose.yml` file:

1. Use a production-ready reverse proxy (Nginx, Traefik, etc.)
2. Enable SSL/TLS
3. Update environment variables for production

Example production docker-compose.yml update:

```yaml
version: '3.8'

services:
  backend:
    restart: always
    environment:
      - NODE_ENV=production
      - CORS_ORIGIN=https://yourdomain.com
    # Other settings...

  frontend:
    restart: always
    environment:
      - VITE_API_URL=https://yourdomain.com/api
      - VITE_API_BASE_URL=https://yourdomain.com
    # Other settings...

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
```

## Troubleshooting

### Check container status

```bash
docker-compose ps
```

### Check container logs

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Access a container shell

```bash
docker-compose exec backend sh
docker-compose exec frontend sh
```

### Rebuild from scratch

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Security Considerations

- Never expose the Docker socket to the application containers
- Use non-root users in containers when possible
- Keep images updated to fix security issues
- Use environment variables for secrets, not hardcoded values
- Implement proper rate limiting and authentication if exposed publicly

## Performance Optimization

- Enable Docker layer caching for faster builds
- Use multi-stage builds to reduce image size
- Optimize Nginx caching for static assets
- Consider using a CDN for production deployments 