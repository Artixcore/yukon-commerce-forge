# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Set Node.js memory options for low-memory servers
# Increase heap size to 1536MB (leaves ~500MB for system on 2GB servers)
ENV NODE_OPTIONS="--max-old-space-size=1536"

# Set Docker build flag for VitePWA optimization
ENV DOCKER_BUILD=true

# Accept build arguments for Supabase environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

# Set environment variables for Vite build
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}

# Copy package files
COPY package*.json ./

# Install dependencies and timeout utility for build timeout handling
# coreutils package provides timeout command on Alpine Linux
# stdbuf is included in coreutils for output flushing
RUN npm ci --prefer-offline --no-audit && \
    apk add --no-cache coreutils

# Copy source code
COPY . .

# Build the application with explicit progress output and timeout handling
# Timeout set to 30 minutes (1800 seconds) to prevent indefinite hangs
# Split into separate RUN commands to ensure build process fully terminates
# Use stdbuf to disable output buffering for immediate log visibility
RUN set -e && \
    echo "=========================================" && \
    echo "Starting Vite build process..." && \
    echo "Build timeout: 30 minutes" && \
    echo "=========================================" && \
    stdbuf -oL -eL timeout 1800 npm run build || (echo "ERROR: Build timed out after 30 minutes!" && exit 1) && \
    echo "=========================================" && \
    echo "Build completed successfully" && \
    echo "=========================================" && \
    sync && \
    echo "File system operations synchronized"

# Verify build output in separate RUN command
# This ensures the build step fully completes and all processes terminate before verification
RUN set -e && \
    echo "=========================================" && \
    echo "Verifying build output..." && \
    echo "=========================================" && \
    if [ ! -d "/app/dist" ]; then \
      echo "ERROR: Build output directory /app/dist does not exist!" && \
      exit 1; \
    fi && \
    if [ -z "$(ls -A /app/dist 2>/dev/null)" ]; then \
      echo "ERROR: Build output directory /app/dist is empty!" && \
      exit 1; \
    fi && \
    echo "Build output verification:" && \
    echo "Directory contents:" && \
    ls -lah /app/dist | head -20 && \
    echo "Build output size:" && \
    du -sh /app/dist && \
    echo "File count:" && \
    find /app/dist -type f | wc -l && \
    echo "=========================================" && \
    echo "Build verification complete - proceeding to next stage" && \
    echo "========================================="

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Install wget for healthcheck (required by docker-compose healthcheck commands)
RUN apk add --no-cache wget

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose ports 80 (HTTP) and 443 (HTTPS)
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

