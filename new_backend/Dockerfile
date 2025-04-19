FROM python:3.11-slim

WORKDIR /app

# Install FFmpeg, curl, Node.js, npm, and git
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg curl gnupg git && \
    # Install Node.js 18.x
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Check Node.js and npm versions
RUN node --version && npm --version

# Copy requirements and install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Set up BgUtil provider manually
RUN cd /root && \
    git clone https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git && \
    cd bgutil-ytdlp-pot-provider && \
    npm install && \
    npm run build

# Copy application code
COPY . /app/

# Create directory for downloads and data directory
RUN mkdir -p /app/downloads /app/app/data && \
    chmod 777 /app/downloads /app/app/data

# Initialize BgUtil server on startup
RUN echo '#!/bin/bash\n\n# Start BgUtil server\ncd /root/bgutil-ytdlp-pot-provider && npm run server &\n\n# Wait a moment for the server to start\nsleep 3\n\n# Display server process\necho "BgUtil server started:"\nps aux | grep bgutil\n\n# Start FastAPI application\necho "Starting FastAPI application..."\nuvicorn app.main:app --host 0.0.0.0 --port 8000' > /app/start.sh && \
    chmod +x /app/start.sh

# Environment variables
ENV PYTHONPATH=/app
ENV PORT=8000
ENV DOWNLOAD_PATH=/app/downloads
ENV API_V1_STR=/api/v1
ENV PROJECT_NAME="YouTube Downloader API"
ENV MAX_RESOLUTION=1080p
ENV FILE_EXPIRY_SECONDS=300
ENV DEBUG=true

# Command to run the application
CMD ["/app/start.sh"] 