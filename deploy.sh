#!/bin/bash
set -e

echo "🚀 Deploying YouTube Downloader FastAPI Backend to Oracle Cloud..."

# Pull latest code if in a git repository
if [ -d ".git" ]; then
  echo "📥 Pulling latest changes..."
  git pull
fi

# Force remove old containers and images to prevent conflicts
echo "🧹 Cleaning up old containers and cache..."
docker-compose down --remove-orphans
docker system prune -af --volumes

# Check if Python and pip are available
if command -v python3 &> /dev/null && command -v pip3 &> /dev/null; then
  # Install dependencies in new_backend folder
  echo "📦 Installing FastAPI backend dependencies locally..."
  if [ -d "new_backend" ]; then
    cd new_backend
    python3 -m pip install -r requirements.txt
    cd ..
  fi
else
  echo "⚠️ Python3/pip3 not found on this system. Skipping local dependency installation."
  echo "ℹ️ This is fine since Docker will handle dependencies during the build."
fi

# Create downloads directory if it doesn't exist
mkdir -p new_backend/downloads
chmod 777 new_backend/downloads

# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Build and start containers with memory limits
echo "🔨 Building and starting containers..."
echo "⌛ Building containers from scratch (this may take a few minutes)..."
docker-compose build --no-cache
docker-compose up -d

# Clean up unused images to save space (important on small instances)
echo "🧹 Cleaning up unused images..."
docker image prune -f

# Print access info
echo "✅ Deployment completed!"
echo "🌐 Your application is now available at: http://84.8.157.166"
echo "🔍 API documentation is available at: http://84.8.157.166/api/v1/docs"
echo "📊 To monitor container status, run: docker-compose ps"
echo "📋 To view logs, run: docker-compose logs -f" 