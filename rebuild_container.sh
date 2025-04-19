#!/bin/bash
set -e

echo "🔄 Rebuilding YouTube Downloader FastAPI Container with updated dependencies"

# Stop and remove the container
echo "⏹️ Stopping the container..."
docker-compose down

# Rebuild the container with no cache
echo "🔨 Rebuilding container with updated requirements..."
docker-compose build --no-cache

# Start the container
echo "▶️ Starting the container..."
docker-compose up -d

# Check if container is running
echo "🔍 Checking container status..."
docker-compose ps

# Show logs
echo "📋 Showing container logs..."
docker-compose logs

echo "✅ Rebuild process completed."
echo "🌐 Your application should now be available at: http://84.8.157.166"
echo "🔍 API documentation is available at: http://84.8.157.166/api/v1/docs" 