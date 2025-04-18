#!/bin/bash
set -e

echo "🚀 Deploying YouTube Downloader to Oracle Cloud..."

# Pull latest code if in a git repository
if [ -d ".git" ]; then
  echo "📥 Pulling latest changes..."
  git pull
fi

# Check if npm is available
if command -v npm &> /dev/null; then
  # Install dependencies in backend folder (helps resolve dependency issues)
  echo "📦 Installing backend dependencies locally..."
  if [ -f "backend/package.json" ]; then
    cd backend
    npm install --no-fund --no-audit
    cd ..
  fi

  # Install dependencies in application folder if it exists
  echo "📦 Installing application dependencies locally..."
  if [ -f "application/package.json" ]; then
    cd application
    npm install --no-fund --no-audit
    cd ..
  fi
else
  echo "⚠️ npm not found on this system. Skipping local dependency installation."
  echo "ℹ️ This is fine since Docker will handle dependencies during the build."
fi

# Build and start containers with memory limits
echo "🔨 Building and starting containers..."
docker-compose down
docker-compose build
docker-compose up -d

# Clean up unused images to save space (important on small instances)
echo "🧹 Cleaning up unused images..."
docker image prune -f

# Print access info
echo "✅ Deployment completed!"
echo "🌐 Your application is now available at: http://84.8.157.166"
echo "🔍 Backend API is available at: http://84.8.157.166/api"
echo "📊 To monitor container status, run: docker-compose ps"
echo "📋 To view logs, run: docker-compose logs -f" 