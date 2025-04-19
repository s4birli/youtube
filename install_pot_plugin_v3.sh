#!/bin/bash

# Exit on error
set -e

echo "===== YouTube Downloader with PO Token Support ====="
echo "Updating and configuring the Docker container..."

# Check if docker-compose exists
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed"
    exit 1
fi

# Set up the data directory
mkdir -p new_backend/app/data

# Check if netscape_cookies.txt exists
if [ ! -f "netscape_cookies.txt" ]; then
    echo "No cookies file found. Creating an empty one for now."
    echo "# Netscape HTTP Cookie File" > netscape_cookies.txt
    echo "# You'll need to manually update this file with valid cookies." >> netscape_cookies.txt
    echo -e "\nWARNING: You'll need to get valid YouTube cookies later for full functionality."
fi

# Copy the cookies file to app data directory
echo "Copying cookies file to app data directory..."
cp netscape_cookies.txt new_backend/app/data/

# Stopping existing containers
echo "Stopping existing containers..."
docker-compose down || true

# Rebuild the Docker image
echo "Rebuilding the Docker image with PO Token support..."
docker-compose build --no-cache backend

# Run the container
echo "Starting the container..."
docker-compose up -d

echo "Waiting for the service to start..."
sleep 15  # Give it time to start

# Check if the service is up
echo "Checking if the service is running..."
if curl -s http://localhost:80/api/v1/youtube/health | grep -q "ok"; then
    echo "Service is running!"
else
    echo "Warning: Service may not be running properly"
    echo "Checking logs..."
    docker-compose logs backend | tail -n 30
fi

# Check if BgUtil server is running
echo "Checking if BgUtil server is running..."
docker-compose exec -T backend ps aux | grep -i bgutil || echo "BgUtil server not found"

echo ""
echo "Setup complete!"
echo ""
echo "IMPORTANT: If you haven't already, you need to create a valid YouTube cookies file."
echo "You can do this in your local browser computer and copy it to this server."
echo ""
echo "Steps to get YouTube cookies:"
echo "1. On your local computer with a browser, install yt-dlp: pip install yt-dlp"
echo "2. Run: yt-dlp --cookies-from-browser chrome --cookies cookies.txt"
echo "3. Copy the cookies.txt file to this server as netscape_cookies.txt"
echo "4. Run: docker cp netscape_cookies.txt youtube-fastapi-backend:/app/app/data/"
echo "5. Restart the container: docker-compose restart backend"
echo ""
echo "If you still have issues, try these troubleshooting steps:"
echo "1. Check logs with: docker-compose logs -f"
echo "2. Try entering the container with: docker-compose exec backend bash"
echo "3. Inside the container, check if BgUtil server is running: ps aux | grep bgutil"
echo "4. Test with a different YouTube video (current one might be region-restricted)"
echo ""
echo "To test downloading a video, run:"
echo "curl --location 'http://localhost:80/api/v1/youtube/download' \\"
echo "--header 'Content-Type: application/json' \\"
echo "--data '{\"url\": \"https://www.youtube.com/watch?v=dQw4w9WgXcQ\", \"format_id\": \"22\", \"audio_only\": false}'"
echo "" 