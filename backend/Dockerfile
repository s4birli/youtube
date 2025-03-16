FROM node:20-slim AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Create production image
FROM node:20-slim

# Ensure required system packages for youtube-dl-exec
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from build stage
COPY --from=build /app/dist ./dist

# Create data directory
RUN mkdir -p /app/data

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DOWNLOAD_TEMP_DIR=/app/data

# Expose port
EXPOSE 3000

# Run the application
CMD ["node", "dist/index.js"] 