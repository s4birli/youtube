#!/bin/bash
set -e

echo "🚀 Deploying YouTube Downloader to Oracle Cloud..."

# Stop running containers
echo "🛑 Stopping running containers..."
docker compose down

# Remove containers and volumes to ensure clean state
echo "🗑️ Removing containers and volumes..."
docker compose rm -f

# Pull latest code if in a git repository
if [ -d ".git" ]; then
  echo "📥 Pulling latest changes..."
  git pull
fi

# Build and start containers with memory limits
echo "🔨 Building and starting containers..."
docker compose build --no-cache
docker compose up -d

# Clean up unused images to save space (important on small instances)
echo "🧹 Cleaning up unused images and volumes..."
docker image prune -f
docker volume prune -f

# Print access info
echo "✅ Deployment completed!"
echo "🌐 Your application is now available at: http://84.8.157.166"
echo "🔍 Backend API is available at: http://84.8.157.166/api"
echo "📊 To monitor container status, run: docker compose ps"
echo "📋 To view logs, run: docker compose logs -f" 