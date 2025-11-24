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
RUN npm ci --prefer-offline --no-audit && \
    apk add --no-cache coreutils || true

# Copy source code
COPY . .

# Build the application with explicit progress output, timeout handling, and verification
# Timeout set to 30 minutes (1800 seconds) to prevent indefinite hangs
RUN echo "=========================================" && \
    echo "Starting Vite build process..." && \
    echo "Build timeout: 30 minutes" && \
    echo "=========================================" && \
    (timeout 1800 npm run build || (echo "ERROR: Build timed out after 30 minutes!" && exit 1)) && \
    echo "=========================================" && \
    echo "Build completed successfully" && \
    echo "=========================================" && \
    # Verify build output exists
    echo "Verifying build output..." && \
    if [ ! -d "/app/dist" ]; then \
      echo "ERROR: Build output directory /app/dist does not exist!" && \
      exit 1; \
    fi && \
    # Verify dist directory contains files
    if [ -z "$(ls -A /app/dist 2>/dev/null)" ]; then \
      echo "ERROR: Build output directory /app/dist is empty!" && \
      exit 1; \
    fi && \
    # List build output for verification
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

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose ports 80 (HTTP) and 443 (HTTPS)
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

