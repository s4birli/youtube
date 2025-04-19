#!/bin/bash

# Exit on error
set -e

echo "Updating Docker container with PO Token plugin support..."

# Check if docker-compose exists
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed"
    exit 1
fi

# Rebuild the Docker container
echo "Rebuilding Docker container..."
docker-compose down || true
docker-compose build --no-cache backend
docker-compose up -d

echo "Docker container updated with PO Token plugin support."
echo "Waiting for backend to start..."
sleep 5

# Check if the service is up
echo "Checking if the service is running..."
if curl -s http://localhost:80/api/v1/youtube/health | grep -q "ok"; then
    echo "Service is running!"
else
    echo "Service may not be running properly. Check docker logs with: docker-compose logs -f"
fi

echo ""
echo "To test if PO Token plugin is working, try downloading a video:"
echo "curl --location 'http://localhost:80/api/v1/youtube/download' \\"
echo "--header 'Content-Type: application/json' \\"
echo "--data '{\"url\": \"https://www.youtube.com/watch?v=dQw4w9WgXcQ\", \"format_id\": \"22\", \"audio_only\": false}'"
echo "" 