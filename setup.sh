#!/bin/bash

# Yukon Commerce Forge - Setup Script
# This script automates project setup, dependency installation, and server startup
# Optimized for container execution with auto-restart and non-interactive mode

# Exit on error for setup steps (will be disabled for server loop)
set -e

# Track if we should continue running
RUNNING=true
RESTART_DELAY=2  # Seconds to wait before restarting on failure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if a shared library is available
library_exists() {
    local lib_name="$1"
    local pkg_name="$2"
    
    # Check if library is available via ldconfig (most reliable)
    if ldconfig -p 2>/dev/null | grep -q "$lib_name"; then
        return 0
    fi
    
    # Fallback: check if package is installed via dpkg
    if dpkg -l 2>/dev/null | grep -q "^ii[[:space:]]*${pkg_name}"; then
        return 0
    fi
    
    return 1
}

# Signal handler for graceful shutdown
cleanup() {
    print_info "Received shutdown signal. Stopping server..."
    RUNNING=false
    if [ ! -z "$SERVER_PID" ] && kill -0 $SERVER_PID 2>/dev/null; then
        print_info "Stopping server process (PID: $SERVER_PID)..."
        kill -TERM $SERVER_PID 2>/dev/null || true
        # Wait up to 10 seconds for graceful shutdown
        for i in {1..10}; do
            if ! kill -0 $SERVER_PID 2>/dev/null; then
                break
            fi
            sleep 1
        done
        # Force kill if still running
        if kill -0 $SERVER_PID 2>/dev/null; then
            print_warning "Server did not stop gracefully. Force killing..."
            kill -KILL $SERVER_PID 2>/dev/null || true
        fi
        wait $SERVER_PID 2>/dev/null || true
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Check and install system dependencies required by Node.js
check_system_dependencies() {
    print_info "Checking system dependencies..."
    
    # Check for libatomic.so.1 (provided by libatomic1 package)
    if ! library_exists "libatomic.so.1" "libatomic1"; then
        print_warning "libatomic.so.1 library is missing. This is required for Node.js."
        print_info "Attempting to install libatomic1 package..."
        
        if command_exists sudo; then
            if sudo apt-get update >/dev/null 2>&1 && sudo apt-get install -y libatomic1 >/dev/null 2>&1; then
                print_success "Successfully installed libatomic1 package."
            else
                print_error "Failed to install libatomic1 automatically."
                print_error "Please run manually: sudo apt-get install -y libatomic1"
                exit 1
            fi
        else
            # Try without sudo (for containers running as root)
            if apt-get update >/dev/null 2>&1 && apt-get install -y libatomic1 >/dev/null 2>&1; then
                print_success "Successfully installed libatomic1 package."
            else
                print_error "Cannot install libatomic1 automatically."
                print_error "Please run manually: apt-get install -y libatomic1"
                exit 1
            fi
        fi
    else
        print_success "System dependencies are satisfied."
    fi
}

# Step 1: Check Prerequisites
print_info "Checking prerequisites..."

# Check system dependencies first
check_system_dependencies

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm (it usually comes with Node.js)"
    exit 1
fi

# Try to get Node.js version with error handling
# Temporarily disable exit on error to capture error messages
set +e
NODE_VERSION=$(node --version 2>&1)
NODE_EXIT_CODE=$?
set -e

if [ $NODE_EXIT_CODE -ne 0 ]; then
    print_error "Node.js is installed but cannot execute."
    print_error "Error: $NODE_VERSION"
    if echo "$NODE_VERSION" | grep -q "libatomic.so.1"; then
        print_error "The libatomic.so.1 library is still missing."
        print_error "Please run: sudo apt-get install -y libatomic1"
        print_error "Then restart your terminal or run: source ~/.bashrc"
    fi
    exit 1
fi

# Try to get npm version with error handling
set +e
NPM_VERSION=$(npm --version 2>&1)
NPM_EXIT_CODE=$?
set -e

if [ $NPM_EXIT_CODE -ne 0 ]; then
    print_error "npm is installed but cannot execute."
    print_error "Error: $NPM_VERSION"
    if echo "$NPM_VERSION" | grep -q "libatomic.so.1"; then
        print_error "The libatomic.so.1 library is still missing."
        print_error "Please run: sudo apt-get install -y libatomic1"
        print_error "Then restart your terminal or run: source ~/.bashrc"
    fi
    exit 1
fi

print_success "Node.js version: $NODE_VERSION"
print_success "npm version: $NPM_VERSION"

# Step 2: Install Dependencies
print_info "Installing project dependencies..."
print_info "This may take a few minutes..."

if npm install; then
    print_success "Dependencies installed successfully!"
else
    print_error "Failed to install dependencies. Please check the error messages above."
    exit 1
fi

# Step 2.5: Fix vulnerabilities automatically
print_info "Fixing security vulnerabilities..."
if npm audit fix --force; then
    print_success "Vulnerabilities fixed successfully!"
else
    print_warning "Some vulnerabilities may remain. Continuing anyway..."
fi

# Step 3: Environment Variables Setup (Non-Interactive)
print_info "Checking environment variables..."

ENV_FILE=".env"
REQUIRED_VARS=("VITE_SUPABASE_URL" "VITE_SUPABASE_PUBLISHABLE_KEY")

if [ ! -f "$ENV_FILE" ]; then
    print_warning ".env file not found. Creating template..."
    
    cat > "$ENV_FILE" << EOF
# Supabase Configuration
# Replace these values with your Supabase project credentials
# You can find these in your Supabase project settings: https://app.supabase.com/project/_/settings/api

VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
EOF
    
    print_warning "Created .env file with template variables."
    print_warning "Please edit .env and add your Supabase credentials."
    print_info "You can find your Supabase credentials at: https://app.supabase.com/project/_/settings/api"
else
    print_success ".env file exists."
    
    # Check if required variables are set (non-interactive - just warn)
    MISSING_VARS=()
    source "$ENV_FILE" 2>/dev/null || true
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        print_warning "The following environment variables are missing or empty:"
        for var in "${MISSING_VARS[@]}"; do
            echo "  - $var"
        done
        print_warning "Server may not function correctly without these variables."
    else
        print_success "All required environment variables are set."
    fi
fi

# Step 4: Start Development Server (Continuous with Auto-Restart)
echo ""
print_info "Starting development server in continuous mode..."
print_info "Server will auto-restart on failure (optimized for containers)"
print_info "Send SIGTERM or SIGINT to stop gracefully"
echo ""

# Disable exit on error for the server loop
set +e

RESTART_COUNT=0
while [ "$RUNNING" = true ]; do
    RESTART_COUNT=$((RESTART_COUNT + 1))
    
    if [ $RESTART_COUNT -gt 1 ]; then
        print_warning "Server exited unexpectedly. Restarting in ${RESTART_DELAY} seconds... (Restart #$RESTART_COUNT)"
        sleep $RESTART_DELAY
        
        # Check if we should still be running
        if [ "$RUNNING" != true ]; then
            break
        fi
    fi
    
    print_info "Starting development server..."
    print_info "Server will be available at http://localhost:5173 (or the next available port)"
    
    # Start the server in background and capture PID
    npm run dev &
    SERVER_PID=$!
    
    # Wait for the server process to exit
    wait $SERVER_PID
    EXIT_CODE=$?
    
    # Clear PID variable
    SERVER_PID=""
    
    # If exit code is 0 or 130 (SIGINT), it was a graceful shutdown
    if [ $EXIT_CODE -eq 0 ] || [ $EXIT_CODE -eq 130 ]; then
        print_info "Server stopped gracefully."
        RUNNING=false
        break
    fi
    
    # If we're not running anymore (signal received), break
    if [ "$RUNNING" != true ]; then
        break
    fi
    
    # Otherwise, it crashed - will restart in next iteration
    print_warning "Server exited with code $EXIT_CODE"
done

print_info "Setup script finished."

