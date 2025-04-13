FROM node:20-alpine as builder

WORKDIR /app

# Install Python and dependencies required for yt-dlp
RUN apk add --no-cache python3 py3-pip ffmpeg

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install Python and dependencies required for building/running
RUN apk add --no-cache python3 py3-pip ffmpeg

# Install yt-dlp globally with pip
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install yt-dlp && \
    ln -s /opt/venv/bin/yt-dlp /usr/local/bin/yt-dlp

# Copy package files
COPY package*.json ./

# Install production dependencies only and skip all scripts
RUN npm ci --omit=dev --ignore-scripts

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist

# Create directories for data and public
RUN mkdir -p ./data ./public

# Make yt-dlp executable available in PATH
ENV PATH="/opt/venv/bin:${PATH}"

# Expose port
EXPOSE 3000

# Override the yt-dlp-exec path to use the global yt-dlp
ENV YT_DLP_PATH="/usr/local/bin/yt-dlp"

# Create the node_modules binary directory if it doesn't exist and create a symlink
RUN mkdir -p /app/node_modules/yt-dlp-exec/bin && \
    ln -sf /usr/local/bin/yt-dlp /app/node_modules/yt-dlp-exec/bin/yt-dlp

# Command to run
CMD ["npm", "start"] 