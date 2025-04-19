#!/bin/bash
set -e

echo "🍪 Creating a minimal YouTube cookies file..."

COOKIES_FILE="youtube_cookies.txt"

echo "# Netscape HTTP Cookie File
# This file is for demonstration only and may need to be replaced with real cookies
# Use yt-dlp --cookies-from-browser firefox/chrome/... to generate a proper file

.youtube.com	TRUE	/	TRUE	2147483647	GPS	1
.youtube.com	TRUE	/	TRUE	2147483647	VISITOR_INFO1_LIVE	random-string
.youtube.com	TRUE	/	TRUE	2147483647	YSC	random-string
.youtube.com	TRUE	/	TRUE	2147483647	PREF	f1=50000000&f6=8
.youtube.com	TRUE	/	TRUE	2147483647	LOGIN_INFO	random-placeholder" > $COOKIES_FILE

echo "✅ Created minimal YouTube cookies file at $COOKIES_FILE"
echo "⚠️ Note: This is a minimal placeholder file. For better results:"
echo "    1. Log in to YouTube in your browser"
echo "    2. Use yt-dlp --cookies-from-browser firefox/chrome/... to export real cookies"
echo "    3. Replace this file with your actual cookies"

# Make the file readable
chmod 644 $COOKIES_FILE

echo "🔄 Rebuilding container with cookies file..."
./rebuild_container.sh 