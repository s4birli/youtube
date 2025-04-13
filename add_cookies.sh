#!/bin/bash

# Define the file paths
YOUTUBE_SERVICE="/Users/s4birli/Github/youtube/backend/src/services/youtube.service.ts"

# Function to safely add cookies to ytDlpExec in getVideoInfo method
add_cookies_to_get_video_info() {
  # Find the line with socketTimeout: 10000 in getVideoInfo method and add cookies line after it
  sed -i '' '/socketTimeout: 10000/a\
          cookies: '"'"'\/app\/youtube_cookies.txt'"'"',' "$YOUTUBE_SERVICE"
}

# Function to safely add cookies to dlOptions in downloadVideo method
add_cookies_to_download_video() {
  # Find the line with verbose: true in downloadVideo method and add cookies line after it
  sed -i '' '/verbose: true/a\
        cookies: '"'"'\/app\/youtube_cookies.txt'"'"',' "$YOUTUBE_SERVICE"
}

# Make a backup of the service file
cp "$YOUTUBE_SERVICE" "$YOUTUBE_SERVICE.bak"

# Add cookies to both methods
add_cookies_to_get_video_info
add_cookies_to_download_video

echo "Added cookies configuration to $YOUTUBE_SERVICE"
echo "A backup of the original file was created at $YOUTUBE_SERVICE.bak" 