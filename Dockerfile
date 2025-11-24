# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Set Node.js memory options for low-memory servers
# Increase heap size to 1536MB (leaves ~500MB for system on 2GB servers)
ENV NODE_OPTIONS="--max-old-space-size=1536"

# Accept build arguments for Supabase environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

# Set environment variables for Vite build
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY . .

# Build the application with progress output
# Vite provides build progress output by default
RUN npm run build

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

