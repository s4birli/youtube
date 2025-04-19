#!/bin/bash

# Script to refresh YouTube cookies from a browser

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== YouTube Cookie Refresher =====${NC}"
echo "This script will help you export fresh cookies from your browser"

# Define the full path to yt-dlp
YTDLP_BIN="$HOME/.local/bin/yt-dlp"

# Define cookie file path
COOKIE_FILE="netscape_cookies.txt"

# Check for yt-dlp availability
if [ ! -x "$YTDLP_BIN" ]; then
    echo -e "${RED}Error: yt-dlp not found at $YTDLP_BIN${NC}"
    echo "Try running: pip install yt-dlp --user"
    echo "Or add this to your .bashrc: export PATH=\"\$HOME/.local/bin:\$PATH\""
    exit 1
fi

# Display browser options
echo -e "\n${GREEN}Choose your browser:${NC}"
echo "1) Chrome/Chromium"
echo "2) Firefox"
echo "3) Safari"
echo "4) Edge"
echo "5) Brave"
echo "6) Opera"
echo -n "Enter number (1-6): "
read -r browser_choice

# Map choice to browser name
case $browser_choice in
    1) browser="chrome" ;;
    2) browser="firefox" ;;
    3) browser="safari" ;;
    4) browser="edge" ;;
    5) browser="brave" ;;
    6) browser="opera" ;;
    *) 
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1 
        ;;
esac

echo -e "\n${YELLOW}IMPORTANT: Before continuing, please:${NC}"
echo "1. Open your $browser browser"
echo "2. Visit YouTube and make sure you're logged in"
echo "3. Watch a few videos to make sure your session is active"
echo "4. Keep the browser open during this process"
echo -e "\nPress Enter to continue..."
read -r

echo -e "\n${GREEN}Extracting cookies from $browser...${NC}"
"$YTDLP_BIN" --cookies-from-browser "$browser" --cookies "$COOKIE_FILE" -v

# Check if cookie file was created and has content
if [ -f "$COOKIE_FILE" ] && [ -s "$COOKIE_FILE" ]; then
    echo -e "\n${GREEN}Success! Cookies saved to $COOKIE_FILE${NC}"
    echo "Cookie file size: $(wc -c < "$COOKIE_FILE") bytes"
    echo "Number of cookies: $(grep -v "^#" "$COOKIE_FILE" | wc -l)"
    
    # Make sure data directory exists
    mkdir -p new_backend/app/data
    
    # Copy to the data directory for build process
    echo "Copying cookies to app data directory..."
    cp "$COOKIE_FILE" new_backend/app/data/
    
    # Backup old cookie file in the container if it exists
    echo -e "\n${GREEN}Updating cookies in the Docker container...${NC}"
    if docker ps | grep -q youtube-fastapi-backend; then
        if docker-compose exec -T backend test -f /app/app/data/netscape_cookies.txt; then
            echo "Backing up existing cookies in container..."
            docker-compose exec -T backend cp /app/app/data/netscape_cookies.txt /app/app/data/netscape_cookies.txt.bak
        fi
        
        # Copy new cookies to container
        echo "Copying new cookies to container..."
        docker cp "$COOKIE_FILE" youtube-fastapi-backend:/app/app/data/netscape_cookies.txt
        
        # Restart container to pick up new cookies
        echo "Restarting container to apply new cookies..."
        docker-compose restart backend
    else
        echo "Docker container not running. The cookies will be used next time you start the container."
    fi
    
    echo -e "\n${GREEN}All done! Try downloading a video now.${NC}"
else
    echo -e "\n${RED}Error: Cookie extraction failed or produced empty file${NC}"
    if [ -f "$COOKIE_FILE" ]; then
        echo "Cookie file exists but may be empty or invalid"
    else
        echo "Cookie file was not created"
    fi
    echo "Please make sure you're logged into YouTube in your browser"
    exit 1
fi

# Suggest next steps
echo -e "\n${GREEN}Next steps:${NC}"
echo "1. Test downloading a video using the API endpoint"
echo "2. If issues persist, try another browser or check for YouTube region restrictions"
echo "3. You can also try downloading a different video - some videos are region-restricted" 