#!/bin/bash
set -e

echo "🔄 Updating YouTube Downloader to use visitor data approach (no cookies)"

# Clean up any existing cookies file to avoid confusion
echo "🧹 Removing any existing cookies file..."
rm -f youtube_cookies.txt

# Apply the Docker Compose changes
echo "📝 Updating Docker Compose configuration..."
cp docker-compose.yml docker-compose.yml.bak
# Changes already made to docker-compose.yml

# Copy the updated YouTube service file
echo "📝 Updating YouTube service to use visitor data approach..."
cp -f new_backend/app/services/youtube_service.py new_backend/app/services/youtube_service.py.bak
# Changes already made to youtube_service.py

# Rebuild the container
echo "🔨 Rebuilding container with visitor data approach..."
chmod +x rebuild_container.sh
./rebuild_container.sh

echo "✅ Applied visitor data approach (no cookies)"
echo "🌐 Your application should now be available at: http://84.8.157.166"
echo "🔍 API documentation is available at: http://84.8.157.166/api/v1/docs"
echo "🧪 Try downloading videos now!" 