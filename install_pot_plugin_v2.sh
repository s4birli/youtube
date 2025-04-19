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

# Check if netscape_cookies.txt exists
if [ ! -f "netscape_cookies.txt" ]; then
    echo "Error: netscape_cookies.txt not found"
    echo "Please create this file with valid YouTube cookies"
    exit 1
fi

echo "Checking cookie file size..."
cookie_size=$(stat -c%s "netscape_cookies.txt" 2>/dev/null || stat -f%z "netscape_cookies.txt")
if [ "$cookie_size" -lt 100 ]; then
    echo "Warning: Cookie file seems very small ($cookie_size bytes)"
    echo "This might indicate invalid or expired cookies"
    echo "Continue anyway? (y/n)"
    read -r response
    if [[ "$response" != "y" ]]; then
        echo "Aborted by user"
        exit 1
    fi
fi

# Make the cookie file executable
chmod +x new_backend/app/data/test_cookies.py

# Stopping existing containers
echo "Stopping existing containers..."
docker-compose down || true

# Make sure git is installed in the container
echo "Rebuilding the Docker image with PO Token support..."
docker-compose build --no-cache backend

# Run the container
echo "Starting the container..."
docker-compose up -d

echo "Waiting for the service to start..."
sleep 10

# Check if the service is up
echo "Checking if the service is running..."
if curl -s http://localhost:80/api/v1/youtube/health | grep -q "ok"; then
    echo "Service is running!"
else
    echo "Warning: Service may not be running properly"
    echo "Checking logs..."
    docker-compose logs | tail -n 20
fi

# Execute the test script in the container
echo "Running test script inside the container..."
docker-compose exec -T backend python /app/app/data/test_cookies.py || echo "Test script failed but continuing..."

echo ""
echo "Setup complete!"
echo ""
echo "If you still have issues, try these troubleshooting steps:"
echo "1. Update your cookies by exporting fresh ones from your browser"
echo "2. Check logs with: docker-compose logs -f"
echo "3. Try entering the container with: docker-compose exec backend bash"
echo "4. Inside the container, check if BgUtil server is running: ps aux | grep bgutil"
echo "5. Test with a different YouTube video (current one might be region-restricted)"
echo ""
echo "To test downloading a video, run:"
echo "curl --location 'http://localhost:80/api/v1/youtube/download' \\"
echo "--header 'Content-Type: application/json' \\"
echo "--data '{\"url\": \"https://www.youtube.com/watch?v=dQw4w9WgXcQ\", \"format_id\": \"22\", \"audio_only\": false}'"
echo "" 