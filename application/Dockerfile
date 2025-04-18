FROM node:20-bookworm-slim

# Install ffmpeg, curl, and python
RUN apt-get update && apt-get install -y ffmpeg curl python3 python3-pip && apt-get clean

# Download latest yt-dlp and set permissions
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && ls -la /usr/local/bin/yt-dlp

# Test yt-dlp installation
RUN /usr/local/bin/yt-dlp --version || echo "yt-dlp not working properly"

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Add a symlink if needed by Node.js modules
RUN mkdir -p /app/node_modules/yt-dlp-exec/bin || true
RUN ln -sf /usr/local/bin/yt-dlp /app/node_modules/yt-dlp-exec/bin/yt-dlp || true

# Set environment variable for yt-dlp path
ENV YT_DLP_PATH="/usr/local/bin/yt-dlp"

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 