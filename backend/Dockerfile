FROM node:20-bookworm-slim as builder

WORKDIR /app

# Install required dependencies including build tools and network tools
# Use apt-get for Debian-based image
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg curl python3 g++ make \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies with retry logic and verbose logging
RUN echo "Installing npm dependencies..." && \
    npm ci --registry=https://registry.npmjs.org/ --no-audit --no-fund || \
    npm ci --registry=https://registry.npmjs.org/ --no-audit --no-fund --legacy-peer-deps

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-bookworm-slim

WORKDIR /app

# Install required dependencies including all necessary packages for yt-dlp
# Use apt-get for Debian-based image
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg curl python3 python3-pip ca-certificates openssl bash \
    && rm -rf /var/lib/apt/lists/*

# Ensure Python is correctly installed and linked
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Try to download latest yt-dlp first, fallback to apt installation if that fails
RUN set -e && \
    echo "Attempting to download yt-dlp from GitHub..." && \
    { \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp; \
    } || { \
    echo "Direct download failed, trying to install yt-dlp via apt..." && \
    apt-get update && \
    apt-get install -y yt-dlp && \
    ln -sf /usr/bin/yt-dlp /usr/local/bin/yt-dlp; \
    }

# Create a dummy cookies file (empty but present)
RUN touch /app/youtube_cookies.txt && chmod 644 /app/youtube_cookies.txt

# Copy package files
COPY package*.json ./

# Install production dependencies only with improved reliability
RUN npm ci --registry=https://registry.npmjs.org/ --omit=dev --no-audit --no-fund || \
    npm ci --registry=https://registry.npmjs.org/ --omit=dev --no-audit --no-fund --legacy-peer-deps

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist

# Copy the scripts directory for our helper scripts
COPY src/scripts /app/scripts
# Make scripts executable
RUN chmod +x /app/scripts/*.sh /app/scripts/*.js || echo "Some scripts might not be executable"

# Copy the yt-dlp wrapper script
COPY src/scripts/yt-dlp-wrapper.sh /usr/local/bin/yt-dlp-wrapper
RUN chmod +x /usr/local/bin/yt-dlp-wrapper

# Create directories for data and public
RUN mkdir -p ./data ./public

# Set proper environment variables
ENV YT_DLP_PATH="/usr/local/bin/yt-dlp"
ENV YT_DLP_WRAPPER="/usr/local/bin/yt-dlp-wrapper"
ENV PATH="$PATH:/usr/local/bin"
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV YT_DLP_FORCE_IPV4=1

# Create the node_modules binary directory if it doesn't exist and create a symlink
RUN mkdir -p /app/node_modules/yt-dlp-exec/bin && \
    ln -sf /usr/local/bin/yt-dlp /app/node_modules/yt-dlp-exec/bin/yt-dlp || echo "Symlink creation failed but continuing"

# Use a custom entrypoint script to run the environment check before starting the app
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Command to run
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "start"] 