FROM node:20-alpine as builder

WORKDIR /app

# Install required dependencies including build tools and network tools
RUN apk add --no-cache ffmpeg curl python3 g++ make bind-tools

# Network Diagnostics
RUN echo "--- Builder Stage Network Diagnostics ---" && \
    nslookup registry.npmjs.org && \
    curl -v https://registry.npmjs.org/ && \
    echo "--- End Builder Stage Network Diagnostics ---"

# Set npm config for better reliability
RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set network-timeout 300000

# Copy package files
COPY package*.json ./

# Install dependencies with retry logic
RUN echo "Installing npm dependencies..." && \
    (npm ci --no-audit --no-fund || \
    (echo "First attempt failed, retrying..." && \
    npm cache clean --force && \
    npm ci --no-audit --no-fund)) || \
    (echo "Second attempt failed, trying with legacy peer deps..." && \
    npm ci --no-audit --no-fund --legacy-peer-deps)

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install required dependencies including all necessary packages for yt-dlp and network tools
RUN apk add --no-cache ffmpeg curl python3 py3-pip ca-certificates openssl bash bind-tools

# Ensure Python is correctly installed and linked
RUN ln -sf /usr/bin/python3 /usr/bin/python && \
    python --version && \
    python3 --version

# Network Diagnostics
RUN echo "--- Production Stage Network Diagnostics ---" && \
    nslookup registry.npmjs.org && \
    curl -v https://registry.npmjs.org/ && \
    echo "--- End Production Stage Network Diagnostics ---"

# Set npm config for better reliability
RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set network-timeout 300000

# Download latest yt-dlp and set permissions
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && ls -la /usr/local/bin/yt-dlp

# Create a dummy cookies file (empty but present)
RUN touch /app/youtube_cookies.txt && chmod 644 /app/youtube_cookies.txt

# Test yt-dlp installation with direct URL check
RUN /usr/local/bin/yt-dlp --version || echo "yt-dlp not working properly"
RUN /usr/local/bin/yt-dlp --no-check-certificate --dump-user-agent

# Copy package files
COPY package*.json ./

# Install production dependencies only with improved reliability
RUN echo "Installing production dependencies..." && \
    (npm ci --omit=dev --ignore-scripts --no-audit --no-fund || \
    (echo "First attempt failed, retrying..." && \
    npm cache clean --force && \
    npm ci --omit=dev --ignore-scripts --no-audit --no-fund)) || \
    (echo "Second attempt failed, trying with legacy peer deps..." && \
    npm ci --omit=dev --ignore-scripts --no-audit --no-fund --legacy-peer-deps)

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
    ln -sf /usr/local/bin/yt-dlp /app/node_modules/yt-dlp-exec/bin/yt-dlp && \
    ls -la /app/node_modules/yt-dlp-exec/bin/yt-dlp

# Use a custom entrypoint script to run the environment check before starting the app
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Command to run
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "start"] 