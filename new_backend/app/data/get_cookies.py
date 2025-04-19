#!/usr/bin/env python3
"""
Script to extract YouTube cookies from browsers and save them to a file.
This can be run manually to refresh cookies.
"""

import os
import sys
import platform
import subprocess
from pathlib import Path

# Determine the cookies file path (same as in YouTubeService)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
COOKIES_FILE = os.path.join(SCRIPT_DIR, "youtube_cookies.txt")

def extract_cookies():
    """Extract YouTube cookies from installed browsers"""
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(COOKIES_FILE), exist_ok=True)
    
    print(f"Extracting YouTube cookies to: {COOKIES_FILE}")
    
    # Determine available browsers based on platform
    browsers = []
    system = platform.system().lower()
    
    if system == "darwin":  # macOS
        browsers = ["safari", "chrome", "firefox", "edge"]
    elif system == "windows":
        browsers = ["chrome", "firefox", "edge", "opera"]
    else:  # Linux and others
        browsers = ["chrome", "firefox", "chromium", "opera"]
    
    # Try each browser until we find one with valid cookies
    success = False
    for browser in browsers:
        print(f"Trying to extract cookies from {browser}...")
        try:
            # First check if the browser is available by getting general cookies
            result = subprocess.run(
                [
                    "yt-dlp", 
                    "--cookies-from-browser", 
                    browser, 
                    "--skip-download",
                    "-o", 
                    os.devnull,
                    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                ],
                capture_output=True,
                text=True,
                check=False
            )
            
            # If browser exists, extract YouTube-specific cookies
            if "browser is not supported" not in result.stderr.lower():
                # Extract YouTube-specific cookies
                result = subprocess.run(
                    [
                        "yt-dlp", 
                        "--cookies-from-browser", 
                        f"{browser}:youtube.com", 
                        "--cookies", 
                        COOKIES_FILE,
                        "--skip-download",
                        "-o", 
                        os.devnull,
                        "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    ],
                    capture_output=True,
                    text=True,
                    check=False
                )
                
                # Check if cookies file was created successfully
                if os.path.exists(COOKIES_FILE) and os.path.getsize(COOKIES_FILE) > 0:
                    print(f"✅ Successfully extracted cookies from {browser}")
                    success = True
                    break
                else:
                    print(f"❌ No valid cookies found in {browser} for YouTube")
            else:
                print(f"❌ Browser '{browser}' is not supported or not installed")
                
        except Exception as e:
            print(f"❌ Error extracting from {browser}: {str(e)}")
    
    if success:
        print("\n✅ YouTube cookies successfully extracted!")
        print(f"Cookies file: {COOKIES_FILE}")
        return True
    else:
        print("\n⚠️ Could not extract valid YouTube cookies from any browser.")
        print("Please make sure you are logged into YouTube in at least one browser.")
        return False

if __name__ == "__main__":
    extract_cookies() 