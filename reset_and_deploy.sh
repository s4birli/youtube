#!/bin/bash
set -e

echo "🚀 Complete reset and deploy of YouTube Downloader FastAPI Backend"

# Stop all running containers
echo "⏹️ Stopping all running Docker containers..."
docker stop $(docker ps -a -q) 2>/dev/null || true

# Remove all containers
echo "🗑️ Removing all Docker containers..."
docker rm $(docker ps -a -q) 2>/dev/null || true

# Remove all images
echo "🗑️ Removing all Docker images..."
docker rmi $(docker images -a -q) 2>/dev/null || true

# Remove all volumes
echo "🗑️ Removing all Docker volumes..."
docker volume rm $(docker volume ls -q) 2>/dev/null || true

# Clean up system
echo "🧹 Cleaning up Docker system..."
docker system prune -af --volumes

# Pull latest code if in a git repository
if [ -d ".git" ]; then
  echo "📥 Pulling latest changes..."
  git pull
fi

# Create downloads directory if it doesn't exist
echo "📁 Creating downloads directory..."
mkdir -p new_backend/downloads
chmod 777 new_backend/downloads

# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build and start containers with memory limits
echo "🔨 Building and starting containers from scratch..."
docker-compose build --no-cache
docker-compose up -d

# Print access info
echo "✅ Deployment completed!"
echo "🌐 Your application is now available at: http://84.8.157.166"
echo "🔍 API documentation is available at: http://84.8.157.166/api/v1/docs"
echo "📊 To monitor container status, run: docker-compose ps"
echo "📋 To view logs, run: docker-compose logs -f" 