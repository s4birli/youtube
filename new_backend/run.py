#!/usr/bin/env python3
"""
Simple script to run the YouTube downloader application.
This makes it easier to run the app from any directory.
"""

import os
import sys
import uvicorn

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Run the application
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")
    
    print(f"Starting YouTube Downloader API at http://{host}:{port}")
    print(f"API documentation will be available at http://{host}:{port}/api/v1/docs")
    print(f"Current directory: {os.getcwd()}")
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    ) 