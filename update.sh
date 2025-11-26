#!/bin/bash

# Yukon Commerce Forge - Auto Update Script
# This script checks for git repository updates, pulls them, and optionally rebuilds Docker containers

# Note: We don't use 'set -e' here because we want to handle errors gracefully

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

# Run command with sudo if needed
run_with_sudo() {
    if [ "$EUID" -eq 0 ]; then
        "$@"
    else
        sudo "$@"
    fi
}

# Check for git updates and pull
check_and_pull_updates() {
    print_info "Checking for git repository updates..."
    
    # Check if git is installed
    if ! command_exists git; then
        print_error "Git is not installed. Cannot check for updates."
        return 1
    fi
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        print_warning "Not a git repository. Skipping update check."
        return 1
    fi
    
    # Check if remote origin exists
    if ! git remote get-url origin >/dev/null 2>&1; then
        print_warning "No remote origin configured. Skipping update check."
        return 1
    fi
    
    # Get current branch
    local current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
    if [ -z "$current_branch" ]; then
        print_error "Could not determine current branch. Skipping update."
        return 1
    fi
    
    print_info "Current branch: $current_branch"
    
    # Check for uncommitted changes
    local has_uncommitted=false
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        has_uncommitted=true
        print_warning "You have uncommitted changes in your working directory."
        echo ""
        read -p "Do you want to stash changes before pulling? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Stashing uncommitted changes..."
            git stash push -m "Auto-stash before update $(date +%Y-%m-%d_%H:%M:%S)" || true
            print_success "Changes stashed."
        else
            print_warning "Continuing with uncommitted changes (may cause conflicts)..."
        fi
    fi
    
    # Fetch latest changes
    print_info "Fetching latest changes from origin..."
    if ! git fetch origin "$current_branch" 2>/dev/null; then
        print_error "Failed to fetch updates from remote."
        print_info "This may be due to network issues or authentication problems."
        return 1
    fi
    
    # Check if there are updates available
    local local_commit=$(git rev-parse HEAD 2>/dev/null)
    local remote_commit=$(git rev-parse "origin/$current_branch" 2>/dev/null)
    
    if [ -z "$local_commit" ] || [ -z "$remote_commit" ]; then
        print_error "Could not determine commit status. Skipping update."
        return 1
    fi
    
    if [ "$local_commit" = "$remote_commit" ]; then
        print_success "Repository is already up to date. No updates available."
        return 0
    fi
    
    # Count commits ahead
    local commit_count=$(git rev-list --count HEAD.."origin/$current_branch" 2>/dev/null || echo "0")
    
    # Show what will be updated
    print_info "Updates available: $commit_count new commit(s)"
    echo ""
    print_info "Recent commits to be pulled:"
    git log HEAD.."origin/$current_branch" --oneline --decorate -5 || true
    echo ""
    
    # Pull updates
    print_info "Pulling latest changes..."
    if git pull origin "$current_branch" 2>/dev/null; then
        print_success "Successfully pulled updates from repository!"
        if [ "$commit_count" != "0" ] && [ "$commit_count" != "" ]; then
            print_info "Updated with $commit_count new commit(s)."
        fi
        
        # Restore stashed changes if any
        if [ "$has_uncommitted" = "true" ] && git stash list | grep -q "Auto-stash before update"; then
            echo ""
            read -p "Do you want to restore your stashed changes? (y/N): " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_info "Restoring stashed changes..."
                git stash pop || true
            fi
        fi
        
        return 0
    else
        print_error "Failed to pull updates. This may be due to merge conflicts."
        print_info "You may need to resolve conflicts manually:"
        echo "  1. Check conflicts: git status"
        echo "  2. Resolve conflicts in the files shown"
        echo "  3. Commit the resolution: git add . && git commit"
        return 1
    fi
}

# Detect Docker Compose command
detect_docker_compose() {
    if docker compose version >/dev/null 2>&1; then
        echo "docker compose"
    elif command_exists docker-compose; then
        echo "docker-compose"
    else
        print_error "Docker Compose not found. Please install Docker Compose."
        return 1
    fi
}

# Detect which compose file to use
detect_compose_file() {
    local domain=$1
    
    # Check if SSL is configured
    if [ -n "$domain" ] && [ -f "docker-compose.ssl.yml" ]; then
        # Check if SSL certificate exists
        if [ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/$domain/privkey.pem" ]; then
            echo "docker-compose.ssl.yml"
            return 0
        fi
    fi
    
    # Default to non-SSL
    echo "docker-compose.yml"
}

# Rebuild and restart Docker containers
rebuild_and_restart() {
    print_info "Rebuilding and restarting Docker containers..."
    
    # Detect Docker Compose command
    local docker_compose_cmd=$(detect_docker_compose)
    if [ $? -ne 0 ]; then
        return 1
    fi
    
    # Detect compose file (try to detect domain from environment or existing containers)
    local compose_file="docker-compose.yml"
    
    # Try to detect if SSL is being used by checking running containers
    if docker ps --format '{{.Names}}' | grep -q "yukon-commerce-web"; then
        # Check which compose file was likely used
        if [ -f "docker-compose.ssl.yml" ]; then
            # Try to detect domain from nginx config or environment
            local domain=$(grep -oP 'server_name \K[^;]+' nginx-ssl.conf 2>/dev/null | head -1 || echo "")
            if [ -n "$domain" ]; then
                compose_file=$(detect_compose_file "$domain")
            fi
        fi
    fi
    
    print_info "Using compose file: $compose_file"
    
    # Stop existing containers
    print_info "Stopping existing containers..."
    $docker_compose_cmd -f "$compose_file" down 2>/dev/null || true
    
    # Build Docker image
    print_info "Building Docker image (this may take several minutes)..."
    if $docker_compose_cmd -f "$compose_file" build --progress=plain; then
        print_success "Docker image built successfully!"
    else
        print_error "Failed to build Docker image."
        return 1
    fi
    
    # Start containers
    print_info "Starting containers..."
    if $docker_compose_cmd -f "$compose_file" up -d; then
        print_success "Containers started successfully!"
        
        # Wait a moment for containers to start
        sleep 3
        
        # Check container status
        if $docker_compose_cmd -f "$compose_file" ps | grep -q "Up"; then
            print_success "Application is running!"
            return 0
        else
            print_warning "Containers started but may not be fully ready yet."
            print_info "Check status with: $docker_compose_cmd -f $compose_file ps"
            return 0
        fi
    else
        print_error "Failed to start containers."
        return 1
    fi
}

# Main function
main() {
    echo ""
    print_info "=========================================="
    print_info "Yukon Commerce Forge - Update Script"
    print_info "=========================================="
    echo ""
    
    local rebuild=true
    local rebuild_only=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-rebuild)
                rebuild=false
                shift
                ;;
            --rebuild-only)
                rebuild_only=true
                rebuild=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --no-rebuild      Pull updates without rebuilding Docker containers"
                echo "  --rebuild-only    Rebuild containers without checking for git updates"
                echo "  --help, -h        Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0                 # Check for updates, pull, and rebuild"
                echo "  $0 --no-rebuild   # Pull updates without rebuilding"
                echo "  $0 --rebuild-only # Rebuild containers (skip git check)"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information."
                exit 1
                ;;
        esac
    done
    
    local updates_pulled=false
    
    # Check and pull updates (unless rebuild-only)
    if [ "$rebuild_only" = "false" ]; then
        if check_and_pull_updates; then
            updates_pulled=true
        else
            # If update check failed but we're not in a git repo, that's okay
            if [ ! -d ".git" ]; then
                print_info "Not a git repository. Skipping update check."
            else
                print_warning "Update check failed or no updates available."
            fi
        fi
    else
        print_info "Skipping git update check (--rebuild-only mode)"
    fi
    
    # Rebuild and restart if requested
    if [ "$rebuild" = "true" ]; then
        if [ "$updates_pulled" = "true" ] || [ "$rebuild_only" = "true" ]; then
            echo ""
            if [ "$rebuild_only" = "false" ]; then
                read -p "Do you want to rebuild and restart containers? (Y/n): " -n 1 -r
                echo ""
                if [[ ! $REPLY =~ ^[Nn]$ ]]; then
                    rebuild_and_restart
                else
                    print_info "Skipping rebuild. You can rebuild later with: $0 --rebuild-only"
                fi
            else
                rebuild_and_restart
            fi
        else
            print_info "No updates pulled. Skipping rebuild."
        fi
    else
        print_info "Rebuild skipped (--no-rebuild flag used)"
    fi
    
    echo ""
    print_success "Update process completed!"
    echo ""
    print_info "To view container logs: docker compose logs -f"
    print_info "To check container status: docker compose ps"
}

# Run main function with all arguments
main "$@"

