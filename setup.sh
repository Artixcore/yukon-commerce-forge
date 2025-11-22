#!/bin/bash

# Yukon Commerce Forge - Setup Script
# This script automates project setup, dependency installation, and server startup

set -e  # Exit on error

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

# Step 1: Check Prerequisites
print_info "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm (it usually comes with Node.js)"
    exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

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

# Step 3: Environment Variables Setup
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
    print_warning "Please edit .env and add your Supabase credentials before running the server."
    echo ""
    print_info "You can find your Supabase credentials at:"
    print_info "https://app.supabase.com/project/_/settings/api"
    echo ""
    read -p "Press Enter to continue (you can edit .env later) or Ctrl+C to exit..."
else
    print_success ".env file exists."
    
    # Check if required variables are set
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
        print_warning "Please update your .env file with the required values."
        echo ""
        read -p "Press Enter to continue anyway or Ctrl+C to exit..."
    else
        print_success "All required environment variables are set."
    fi
fi

# Step 4: Start Development Server
echo ""
print_info "Starting development server..."
print_info "The server will start at http://localhost:5173 (or the next available port)"
print_info "Press Ctrl+C to stop the server"
echo ""

npm run dev

