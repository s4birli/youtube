FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Install youtube-dl
RUN apk add --no-cache python3 py3-pip ffmpeg && \
    pip3 install yt-dlp

# Create necessary directories
RUN mkdir -p data/downloads && \
    chmod -R 777 data

# Expose the port the app runs on
EXPOSE 3001

# Start the application
CMD ["node", "dist/index.js"] 