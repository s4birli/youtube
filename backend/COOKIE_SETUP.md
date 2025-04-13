# YouTube Cookie Setup Guide

## Why Cookies Are Needed

YouTube requires authentication for certain operations. Using cookies from a logged-in session helps:
- Access age-restricted content
- Get higher quality streams
- Avoid rate limiting
- Access premium content (if you have a premium account)

## How to Get YouTube Cookies

### Method 1: Using Chrome with EditThisCookie Extension (Recommended)

1. Install the [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg) extension in Chrome
2. Go to [YouTube](https://www.youtube.com) and log in to your account
3. Click the EditThisCookie icon in your browser's toolbar
4. Click the "Export" button (this copies the cookies to your clipboard in JSON format)
5. Create a file named `youtube_cookies.json` in the `backend` directory
6. Paste the copied cookies into this file and save it

### Method 2: Using Firefox with Cookie-Editor Extension

1. Install the [Cookie-Editor](https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/) extension in Firefox
2. Go to [YouTube](https://www.youtube.com) and log in to your account
3. Click the Cookie-Editor icon in your browser's toolbar
4. Click "Export" and then "Export as JSON" (this copies the cookies to your clipboard)
5. Create a file named `youtube_cookies.json` in the `backend` directory
6. Paste the copied cookies into this file and save it

## Converting Cookies to Netscape Format

The included script will convert your JSON format cookies to the Netscape format required by yt-dlp:

```bash
# Navigate to the backend directory
cd backend

# Make the script executable
chmod +x scripts/convert-cookies.js

# Run the converter (default: reads youtube_cookies.json, outputs youtube_cookies.txt)
node scripts/convert-cookies.js

# Alternatively, specify custom input and output paths
node scripts/convert-cookies.js path/to/input.json path/to/output.txt
```

## Adding Cookies to Docker

The Docker setup is configured to use cookies from `/app/youtube_cookies.txt`. When you run the application with Docker:

1. Make sure you've converted your cookies to Netscape format by running the converter script
2. The `docker-compose.yml` file automatically mounts the local `backend/youtube_cookies.txt` file to `/app/youtube_cookies.txt` in the container

## Troubleshooting

If you encounter issues with yt-dlp and cookies:

1. Verify that your cookies are in the correct Netscape format
2. Make sure your cookies are not expired (re-export them if in doubt)
3. Check that the file path in the configuration matches the actual location
4. Try logging in again to YouTube before exporting cookies

## Cookie Format Reference

Netscape cookie format has this structure:

```
# Netscape HTTP Cookie File
# https://curl.haxx.se/docs/http-cookies.html
# Each line contains: domain flag path secure expiry name value

.youtube.com	TRUE	/	TRUE	1718385409	GPS	1
```

## Security Note

Your cookies provide access to your YouTube account. Handle them securely:
- Don't commit cookies to public repositories
- Add `youtube_cookies.json` and `youtube_cookies.txt` to your `.gitignore` file
- Refresh cookies periodically for security 