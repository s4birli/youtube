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
    echo "Please create this file with valid YouTube cookies using ./refresh_cookies.sh"
    exit 1
fi

# Ensure the data directory exists
mkdir -p new_backend/app/data

# Copy the cookies file to both locations to ensure it's available during build and runtime
echo "Copying cookies file to necessary locations..."
cp netscape_cookies.txt new_backend/app/data/

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
echo "Setting up test script..."
if [ -f "new_backend/app/data/test_cookies.py" ]; then
    chmod +x new_backend/app/data/test_cookies.py
else
    echo "Warning: test_cookies.py not found. Continuing anyway..."
fi

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
sleep 15  # Give it a bit more time to start

# Check if the service is up
echo "Checking if the service is running..."
if curl -s http://localhost:80/api/v1/youtube/health | grep -q "ok"; then
    echo "Service is running!"
else
    echo "Warning: Service may not be running properly"
    echo "Checking logs..."
    docker-compose logs backend | tail -n 30
fi

# Copy the cookies file to the running container
echo "Copying cookies to the running container..."
docker cp netscape_cookies.txt youtube-fastapi-backend:/app/app/data/

# Check if BgUtil server is running
echo "Checking if BgUtil server is running..."
docker-compose exec -T backend ps aux | grep -i bgutil

# Execute the test script in the container
echo "Running test script inside the container..."
if docker-compose exec -T backend python /app/app/data/test_cookies.py; then
    echo "Test script completed successfully!"
else
    echo "Warning: Test script failed. Continuing anyway..."
    echo "Checking container logs..."
    docker-compose logs backend | tail -n 20
fi

echo ""
echo "Setup complete!"
echo ""
echo "If you still have issues, try these troubleshooting steps:"
echo "1. Update your cookies by running: ./refresh_cookies.sh"
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