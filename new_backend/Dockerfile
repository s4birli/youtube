FROM python:3.11-slim

WORKDIR /app

# Install FFmpeg and curl
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app/

# Create directory for downloads
RUN mkdir -p /app/downloads && \
    chmod 777 /app/downloads

# Environment variables
ENV PYTHONPATH=/app
ENV PORT=8000
ENV DOWNLOAD_PATH=/app/downloads
ENV API_V1_STR=/api/v1
ENV PROJECT_NAME="YouTube Downloader API"
ENV MAX_RESOLUTION=1080p
ENV FILE_EXPIRY_SECONDS=300
ENV DEBUG=false

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"] 