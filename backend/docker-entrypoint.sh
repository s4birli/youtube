#!/bin/sh
set -e

# Print environment information
echo "Environment: $(node -e "console.log(process.env.NODE_ENV)")"
echo "Current directory: $(pwd)"
echo "Files in current directory: $(ls -la)"
echo "Python version: $(python3 --version 2>&1 || echo 'Python not found')"

# Install additional dependencies if needed
if ! which python3 >/dev/null 2>&1; then
  echo "Python3 not found, installing..."
  apk add --no-cache python3 py3-pip
fi

# Create a cookies file if it doesn't exist
if [ ! -f "/app/youtube_cookies.txt" ]; then
  echo "Creating empty cookies file..."
  touch /app/youtube_cookies.txt
  chmod 644 /app/youtube_cookies.txt
fi

# Run the environment check script if it exists
if [ -f "/app/scripts/check-yt-dlp.js" ]; then
  echo "Running YT-DLP environment check..."
  node /app/scripts/check-yt-dlp.js
else
  echo "Warning: Environment check script not found at /app/scripts/check-yt-dlp.js"
fi

# Check if the wrapper script exists
if [ ! -f "/usr/local/bin/yt-dlp-wrapper" ]; then
  echo "Warning: yt-dlp wrapper script not found, creating it..."
  
  # Create a basic wrapper script if it doesn't exist
  cat > /usr/local/bin/yt-dlp-wrapper << 'EOF'
#!/bin/sh
# Basic yt-dlp wrapper
echo "Running yt-dlp wrapper $(date)" >> /app/yt-dlp-debug.log
echo "Command: yt-dlp $@" >> /app/yt-dlp-debug.log
/usr/local/bin/yt-dlp "$@"
exit $?
EOF
  
  chmod +x /usr/local/bin/yt-dlp-wrapper
  echo "Created wrapper script at /usr/local/bin/yt-dlp-wrapper"
fi

# Check if yt-dlp exists and is executable
if [ ! -x "/usr/local/bin/yt-dlp" ]; then
  echo "Warning: yt-dlp not found or not executable, downloading now..."
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
  chmod a+rx /usr/local/bin/yt-dlp
  echo "Downloaded yt-dlp to /usr/local/bin/yt-dlp"
fi

# Test yt-dlp
echo "Testing yt-dlp..."
/usr/local/bin/yt-dlp --version || echo "Warning: yt-dlp test failed"

# Test YouTube connectivity
echo "Testing YouTube connectivity..."
YOUTUBE_TEST_URL="https://www.youtube.com/watch?v=jNQXAC9IVRw"
echo "Attempting to access: $YOUTUBE_TEST_URL"
CONNECTABILITY=$(curl -s -I -L "$YOUTUBE_TEST_URL" | head -n 1)
echo "YouTube connection test result: $CONNECTABILITY"

# Check if we can reach YouTube with yt-dlp
echo "Testing yt-dlp YouTube connectivity..."
/usr/local/bin/yt-dlp --no-check-certificate --skip-download --dump-single-json --no-warnings "$YOUTUBE_TEST_URL" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ yt-dlp can successfully connect to YouTube!"
else
  echo "❌ yt-dlp failed to connect to YouTube."
  echo "This may be due to IP blocking, proxy requirements, or network restrictions."
  echo "Trying with additional options..."
  
  # Try with additional options
  /usr/local/bin/yt-dlp --verbose --no-check-certificate --force-ipv4 --geo-bypass --skip-download --print-traffic "$YOUTUBE_TEST_URL" > /tmp/yt-dlp-test.log 2>&1
  echo "Debug log from test available at /tmp/yt-dlp-test.log"
fi

# Ensure correct symlink for node_modules
if [ -d "/app/node_modules/yt-dlp-exec" ]; then
  echo "Setting up yt-dlp-exec symlink..."
  mkdir -p /app/node_modules/yt-dlp-exec/bin
  ln -sf /usr/local/bin/yt-dlp /app/node_modules/yt-dlp-exec/bin/yt-dlp
fi

# Run whatever was passed as command
echo "Starting application with command: $@"
exec "$@" 