#!/bin/bash

# Yukon Commerce Forge - AWS EC2 Auto Deployment Script
# This script automates complete server setup including Docker, nginx, SSL, and firewall configuration
# Optimized for AWS EC2 deployment with automatic production deployment

# Exit on error for setup steps
set -e

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

# Check if running as root or with sudo
is_root_or_sudo() {
    [ "$EUID" -eq 0 ] || command_exists sudo
}

# Run command with sudo if needed
run_with_sudo() {
    if [ "$EUID" -eq 0 ]; then
        "$@"
    else
        sudo "$@"
    fi
}

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    else
        print_error "Cannot detect OS. This script supports Ubuntu/Debian systems."
        exit 1
    fi
}

# Install Docker
install_docker() {
    print_info "Installing Docker..."
    
    if ! command_exists docker; then
        print_info "Docker not found. Installing Docker..."
        
        # Update package index
        run_with_sudo apt-get update -qq
        
        # Install prerequisites
        run_with_sudo apt-get install -y -qq \
            ca-certificates \
            curl \
            gnupg \
            lsb-release
        
        # Add Docker's official GPG key
        install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | run_with_sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        run_with_sudo chmod a+r /etc/apt/keyrings/docker.gpg
        
        # Set up Docker repository
        echo \
            "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
            $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
            run_with_sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Install Docker Engine
        run_with_sudo apt-get update -qq
        run_with_sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
        # Add current user to docker group (if not root)
        if [ "$EUID" -ne 0 ]; then
            run_with_sudo usermod -aG docker $USER
            print_warning "Added user to docker group. You may need to log out and back in for this to take effect."
        fi
        
        # Start Docker service
        run_with_sudo systemctl enable docker
        run_with_sudo systemctl start docker
        
        print_success "Docker installed successfully!"
    else
        print_success "Docker is already installed."
    fi
    
    # Verify Docker installation
    if docker --version >/dev/null 2>&1; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker version: $DOCKER_VERSION"
    else
        print_error "Docker installation verification failed."
        exit 1
    fi
}

# Check Docker Compose availability
check_docker_compose() {
    print_info "Checking Docker Compose..."
    
    # Check for docker compose (plugin) or docker-compose (standalone)
    if docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
        print_success "Docker Compose plugin is available."
    elif command_exists docker-compose; then
        DOCKER_COMPOSE_CMD="docker-compose"
        print_success "Docker Compose standalone is available."
    else
        print_error "Docker Compose not found. Please install Docker Compose."
        exit 1
    fi
}

# Configure firewall
configure_firewall() {
    print_info "Configuring firewall (ufw)..."
    
    if ! command_exists ufw; then
        print_info "Installing ufw..."
        run_with_sudo apt-get update -qq
        run_with_sudo apt-get install -y -qq ufw
    fi
    
    # Allow SSH (important!)
    run_with_sudo ufw allow 22/tcp comment 'SSH' || true
    
    # Allow HTTP and HTTPS
    run_with_sudo ufw allow 80/tcp comment 'HTTP' || true
    run_with_sudo ufw allow 443/tcp comment 'HTTPS' || true
    
    # Enable firewall (non-interactive)
    echo "y" | run_with_sudo ufw --force enable || true
    
    print_success "Firewall configured. Ports 22, 80, and 443 are open."
}

# Setup SSL with Let's Encrypt
setup_ssl() {
    local domain=$1
    local docker_compose_cmd=$2
    
    if [ -z "$domain" ]; then
        print_warning "No domain provided. Skipping SSL setup. Site will be accessible via HTTP only."
        return 0
    fi
    
    print_info "Setting up SSL certificate for domain: $domain"
    
    # Install certbot
    if ! command_exists certbot; then
        print_info "Installing certbot..."
        run_with_sudo apt-get update -qq
        run_with_sudo apt-get install -y -qq certbot python3-certbot-nginx
    fi
    
    # Check if domain resolves to this server
    print_info "Verifying domain DNS configuration..."
    local public_ip=$(curl -s https://api.ipify.org || curl -s https://ifconfig.me || echo "")
    local domain_ip=$(dig +short $domain | tail -n1 || echo "")
    
    if [ -z "$public_ip" ]; then
        print_warning "Could not determine public IP. SSL setup may fail if domain doesn't point to this server."
    elif [ -z "$domain_ip" ]; then
        print_warning "Could not resolve domain $domain. SSL setup may fail."
    elif [ "$public_ip" != "$domain_ip" ]; then
        print_warning "Domain $domain ($domain_ip) does not point to this server ($public_ip). SSL setup may fail."
    else
        print_success "Domain DNS configuration verified."
    fi
    
    # Create directory for SSL certificates
    run_with_sudo mkdir -p /etc/letsencrypt/live/$domain
    run_with_sudo mkdir -p /etc/letsencrypt/archive/$domain
    
    # Generate certificate using standalone mode (since nginx isn't running yet)
    print_info "Generating SSL certificate..."
    
    # Stop any running containers temporarily for certbot (port 80 must be free)
    print_info "Stopping any running containers to free port 80 for certbot..."
    $docker_compose_cmd down 2>/dev/null || true
    
    # Wait a moment for ports to be released
    sleep 2
    
    # Generate certificate
    print_info "Requesting SSL certificate from Let's Encrypt..."
    if run_with_sudo certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email admin@$domain \
        --domains $domain \
        --preferred-challenges http \
        --keep-until-expiring; then
        print_success "SSL certificate generated successfully!"
        
        # Set up auto-renewal
        print_info "Setting up SSL certificate auto-renewal..."
        local renew_hook="$docker_compose_cmd restart web || true"
        (run_with_sudo crontab -l 2>/dev/null | grep -v "certbot renew" | grep -v "# Yukon Commerce SSL renewal"; echo "0 0 * * * certbot renew --quiet --deploy-hook '$renew_hook' # Yukon Commerce SSL renewal") | run_with_sudo crontab - || true
        
        return 0
    else
        print_error "Failed to generate SSL certificate."
        print_warning "Continuing without SSL. You can set it up manually later with:"
        print_warning "  sudo certbot certonly --standalone -d $domain"
        return 1
    fi
}

# Check and setup environment variables
setup_environment() {
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
        print_warning "Please edit .env and add your Supabase credentials before building."
        print_info "You can find your Supabase credentials at: https://app.supabase.com/project/_/settings/api"
        
        # Check if we should continue
        read -p "Do you want to continue without Supabase credentials? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Please edit .env file and run this script again."
            exit 0
        fi
    else
        print_success ".env file exists."
        
        # Check if required variables are set
        MISSING_VARS=()
        set +e
        source "$ENV_FILE" 2>/dev/null || true
        set -e
        
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
            print_warning "Application may not function correctly without these variables."
        else
            print_success "All required environment variables are set."
        fi
    fi
}

# Build and deploy with Docker Compose
deploy_with_docker() {
    local domain=$1
    local use_ssl=$2
    
    print_info "Building and deploying application with Docker..."
    
    # Stop and remove existing containers
    print_info "Stopping any existing containers..."
    $DOCKER_COMPOSE_CMD down 2>/dev/null || true
    
    # Build Docker image
    print_info "Building Docker image (this may take several minutes)..."
    if $DOCKER_COMPOSE_CMD build; then
        print_success "Docker image built successfully!"
    else
        print_error "Failed to build Docker image."
        exit 1
    fi
    
    # Determine which compose file to use
    local compose_file="docker-compose.yml"
    if [ "$use_ssl" = "true" ] && [ -f "docker-compose.ssl.yml" ]; then
        compose_file="docker-compose.ssl.yml"
        print_info "Using SSL-enabled Docker Compose configuration."
        
        # Create nginx-ssl.conf from template if domain is provided
        if [ -f "nginx-ssl.conf.template" ] && [ -n "$domain" ]; then
            print_info "Configuring nginx SSL configuration for domain: $domain"
            sed "s/__DOMAIN__/$domain/g" nginx-ssl.conf.template > nginx-ssl.conf
        elif [ ! -f "nginx-ssl.conf" ]; then
            print_error "nginx-ssl.conf.template not found. Cannot configure SSL."
            exit 1
        fi
    fi
    
    # Start containers
    print_info "Starting containers..."
    if $DOCKER_COMPOSE_CMD -f "$compose_file" up -d; then
        print_success "Containers started successfully!"
    else
        print_error "Failed to start containers."
        exit 1
    fi
    
    # Wait a moment for containers to start
    sleep 3
    
    # Check container status
    if $DOCKER_COMPOSE_CMD -f "$compose_file" ps | grep -q "Up"; then
        print_success "Application is running!"
        
        # Get public IP
        local public_ip=$(curl -s https://api.ipify.org || curl -s https://ifconfig.me || echo "your-server-ip")
        
        echo ""
        print_success "=========================================="
        print_success "Deployment completed successfully!"
        print_success "=========================================="
        echo ""
        
        if [ "$use_ssl" = "true" ] && [ -n "$domain" ]; then
            print_info "Your site is accessible at:"
            echo "  - https://$domain"
            echo "  - http://$domain (will redirect to HTTPS)"
        else
            print_info "Your site is accessible at:"
            echo "  - http://$public_ip"
            if [ -n "$domain" ]; then
                echo "  - http://$domain"
            fi
        fi
        
        echo ""
        print_info "To view logs: $DOCKER_COMPOSE_CMD logs -f"
        print_info "To stop: $DOCKER_COMPOSE_CMD down"
        print_info "To restart: $DOCKER_COMPOSE_CMD restart"
        echo ""
    else
        print_error "Containers failed to start. Check logs with: $DOCKER_COMPOSE_CMD logs"
        exit 1
    fi
}

# Main execution
main() {
    echo ""
    print_info "=========================================="
    print_info "Yukon Commerce Forge - AWS EC2 Deployment"
    print_info "=========================================="
    echo ""
    
    # Detect OS
    detect_os
    print_info "Detected OS: $OS $OS_VERSION"
    
    # Check for root/sudo
    if ! is_root_or_sudo; then
        print_error "This script requires root privileges or sudo access."
        print_error "Please run with: sudo ./setup.sh"
        exit 1
    fi
    
    # Step 1: Install Docker
    install_docker
    
    # Step 2: Check Docker Compose
    check_docker_compose
    
    # Step 3: Configure firewall
    configure_firewall
    
    # Step 4: Setup environment variables
    setup_environment
    
    # Step 5: Ask for domain (optional)
    echo ""
    read -p "Enter your domain name (or press Enter to skip SSL setup): " DOMAIN
    DOMAIN=$(echo "$DOMAIN" | xargs) # Trim whitespace
    
    USE_SSL="false"
    if [ -n "$DOMAIN" ]; then
        USE_SSL="true"
        # Setup SSL
        setup_ssl "$DOMAIN" "$DOCKER_COMPOSE_CMD"
        # Update SSL status based on certificate generation
        if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
            USE_SSL="false"
            print_warning "SSL certificate not found. Continuing with HTTP only."
        fi
    fi
    
    # Step 6: Deploy with Docker
    deploy_with_docker "$DOMAIN" "$USE_SSL"
    
    print_success "Setup completed successfully!"
}

# Run main function
main
