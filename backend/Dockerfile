FROM node:20-alpine as builder

WORKDIR /app

# Install required dependencies
RUN apk add --no-cache ffmpeg curl

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

# Install required dependencies
RUN apk add --no-cache ffmpeg curl

# Download latest yt-dlp and set permissions
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

# Copy package files
COPY package*.json ./

# Install production dependencies only and skip all scripts
RUN npm ci --omit=dev --ignore-scripts

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist

# Create directories for data and public
RUN mkdir -p ./data ./public

# Expose port
EXPOSE 3000

# Override the yt-dlp-exec path to use the global yt-dlp
ENV YT_DLP_PATH="/usr/local/bin/yt-dlp"

# Create the node_modules binary directory if it doesn't exist and create a symlink
RUN mkdir -p /app/node_modules/yt-dlp-exec/bin && \
    ln -sf /usr/local/bin/yt-dlp /app/node_modules/yt-dlp-exec/bin/yt-dlp

# Command to run
CMD ["npm", "start"] 