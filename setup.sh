#!/bin/bash

# Yukon Commerce Forge - AWS EC2 Auto Deployment Script
# This script automates complete server setup including Docker, nginx, SSL, and firewall configuration
# Optimized for AWS EC2 deployment with automatic production deployment
#
# TROUBLESHOOTING:
# If you encounter errors like "//: Permission denied", "import: not found", or "const: not found",
# this usually indicates Windows line endings (CRLF) instead of Unix line endings (LF).
# 
# To fix on Ubuntu/Debian:
#   1. Install dos2unix: sudo apt-get install dos2unix
#   2. Convert line endings: dos2unix setup.sh
#   OR use sed: sed -i 's/\r$//' setup.sh
#
# Alternative fix:
#   sed -i 's/\r$//' setup.sh && chmod +x setup.sh
#
# Verify the fix:
#   file setup.sh  (should show "Bourne-Again shell script")
#   head -1 setup.sh | od -c  (should show \n, not \r\n)

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

# Check script integrity and line endings
check_script_integrity() {
    # Check if this script has CRLF line endings by examining itself
    local script_path="${BASH_SOURCE[0]}"
    if [ -f "$script_path" ]; then
        # Count carriage returns in first few lines
        local cr_count=$(head -5 "$script_path" 2>/dev/null | grep -c $'\r' || echo "0")
        if [ "$cr_count" -gt 0 ]; then
            print_error "This script appears to have Windows line endings (CRLF)."
            print_error "Please convert to Unix line endings (LF) before running."
            echo ""
            print_info "To fix, run one of these commands:"
            echo "  dos2unix $script_path"
            echo "  OR"
            echo "  sed -i 's/\r$//' $script_path"
            echo ""
            print_info "Then make it executable:"
            echo "  chmod +x $script_path"
            exit 1
        fi
    fi
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
    # Try lsb_release first (most reliable for Ubuntu)
    if command_exists lsb_release; then
        OS=$(lsb_release -si | tr '[:upper:]' '[:lower:]')
        OS_VERSION=$(lsb_release -sr)
        print_info "Detected OS via lsb_release: $OS $OS_VERSION"
    elif [ -f /etc/lsb-release ]; then
        # Fallback to /etc/lsb-release
        . /etc/lsb-release
        OS=$(echo "$DISTRIB_ID" | tr '[:upper:]' '[:lower:]')
        OS_VERSION="$DISTRIB_RELEASE"
        print_info "Detected OS via /etc/lsb-release: $OS $OS_VERSION"
    elif [ -f /etc/os-release ]; then
        # Fallback to /etc/os-release (may have incorrect VERSION_ID)
        . /etc/os-release
        OS=$ID
        
        # Try to get more accurate version from VERSION if VERSION_ID seems wrong
        if [ -n "$VERSION" ] && [[ "$VERSION" =~ [0-9]+\.[0-9]+ ]]; then
            # Extract version from VERSION string (e.g., "22.04 LTS (Jammy Jellyfish)")
            OS_VERSION=$(echo "$VERSION" | grep -oE '[0-9]+\.[0-9]+' | head -1)
        else
            OS_VERSION=$VERSION_ID
        fi
        
        print_info "Detected OS via /etc/os-release: $OS $OS_VERSION"
    else
        print_error "Cannot detect OS. This script supports Ubuntu/Debian systems."
        exit 1
    fi
    
    # Validate OS is Ubuntu or Debian
    if [[ "$OS" != "ubuntu" ]] && [[ "$OS" != "debian" ]]; then
        print_warning "Detected OS: $OS $OS_VERSION"
        print_warning "This script is optimized for Ubuntu/Debian. Proceeding anyway..."
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

# Verify ports 80 and 443 are available
verify_ports() {
    print_info "Verifying ports 80 and 443 availability..."
    
    local ports_in_use=()
    local port_check_failed=false
    
    # Check port 80
    if command_exists lsof; then
        if run_with_sudo lsof -i :80 >/dev/null 2>&1; then
            ports_in_use+=("80")
            port_check_failed=true
        fi
    elif command_exists ss; then
        if run_with_sudo ss -tuln | grep -q ":80 "; then
            ports_in_use+=("80")
            port_check_failed=true
        fi
    elif command_exists netstat; then
        if run_with_sudo netstat -tuln | grep -q ":80 "; then
            ports_in_use+=("80")
            port_check_failed=true
        fi
    fi
    
    # Check port 443
    if command_exists lsof; then
        if run_with_sudo lsof -i :443 >/dev/null 2>&1; then
            ports_in_use+=("443")
            port_check_failed=true
        fi
    elif command_exists ss; then
        if run_with_sudo ss -tuln | grep -q ":443 "; then
            ports_in_use+=("443")
            port_check_failed=true
        fi
    elif command_exists netstat; then
        if run_with_sudo netstat -tuln | grep -q ":443 "; then
            ports_in_use+=("443")
            port_check_failed=true
        fi
    fi
    
    if [ "$port_check_failed" = "true" ]; then
        print_warning "The following ports are currently in use: ${ports_in_use[*]}"
        print_info "Attempting to identify processes using these ports..."
        
        for port in "${ports_in_use[@]}"; do
            if command_exists lsof; then
                print_info "Port $port processes:"
                run_with_sudo lsof -i :$port || true
            fi
        done
        
        print_warning "Ports 80 and 443 need to be available for web server."
        print_info "The script will attempt to stop conflicting services during deployment."
        return 1
    else
        print_success "Ports 80 and 443 are available."
        return 0
    fi
}

# Check and install system dependencies
check_system_dependencies() {
    print_info "Checking system dependencies..."
    
    local missing_deps=()
    local deps_to_install=()
    
    # Required dependencies
    local required_deps=("curl" "dig" "lsof" "ss" "git")
    
    for dep in "${required_deps[@]}"; do
        if ! command_exists "$dep"; then
            missing_deps+=("$dep")
        fi
    done
    
    # Map dependencies to package names
    if [[ " ${missing_deps[@]} " =~ " dig " ]]; then
        deps_to_install+=("dnsutils")
    fi
    
    if [[ " ${missing_deps[@]} " =~ " lsof " ]]; then
        deps_to_install+=("lsof")
    fi
    
    if [[ " ${missing_deps[@]} " =~ " ss " ]]; then
        # ss is part of iproute2, usually pre-installed
        # But we'll check anyway
        if ! command_exists ss; then
            deps_to_install+=("iproute2")
        fi
    fi
    
    # curl is usually pre-installed, but check anyway
    if [[ " ${missing_deps[@]} " =~ " curl " ]]; then
        deps_to_install+=("curl")
    fi
    
    # git is required for auto-updates
    if [[ " ${missing_deps[@]} " =~ " git " ]]; then
        deps_to_install+=("git")
    fi
    
    if [ ${#deps_to_install[@]} -gt 0 ]; then
        print_info "Installing missing dependencies: ${deps_to_install[*]}"
        run_with_sudo apt-get update -qq
        run_with_sudo apt-get install -y -qq "${deps_to_install[@]}"
        print_success "Dependencies installed successfully."
    else
        print_success "All required system dependencies are available."
    fi
}

# Check Docker Compose availability and Docker daemon
check_docker_compose() {
    print_info "Checking Docker Compose..."
    
    # Check Docker service status first (more reliable than docker info)
    local docker_service_running=false
    if systemctl is-active --quiet docker 2>/dev/null; then
        docker_service_running=true
        print_info "Docker service is running."
    fi
    
    # Verify Docker daemon is accessible
    if ! docker info >/dev/null 2>&1; then
        if [ "$docker_service_running" = "true" ]; then
            # Service is running but docker command fails - likely permission issue
            print_warning "Docker service is running but docker command failed (likely permission issue)."
            
            # Check if user is in docker group
            if [ "$EUID" -ne 0 ]; then
                if groups | grep -q docker; then
                    print_warning "User is in docker group but docker command still fails."
                    print_info "You may need to log out and back in for group changes to take effect."
                    print_info "Alternatively, you can use 'sudo docker' commands."
                    # Try with sudo to verify Docker works
                    if sudo docker info >/dev/null 2>&1; then
                        print_info "Docker works with sudo. Continuing with sudo for Docker commands..."
                        # Note: This is handled by run_with_sudo in the script
                    fi
                else
                    print_warning "User is not in docker group. Adding user to docker group..."
                    run_with_sudo usermod -aG docker $USER
                    print_warning "User added to docker group. You may need to log out and back in."
                    print_info "For now, Docker commands will use sudo."
                fi
            fi
        else
            # Service is not running
            print_warning "Docker daemon is not running."
        
            # Check if Docker service exists
            if systemctl list-unit-files | grep -q docker.service; then
                print_info "Docker service found. Attempting to start Docker daemon..."
                
                # Enable Docker service if not enabled
                if ! systemctl is-enabled docker >/dev/null 2>&1; then
                    print_info "Enabling Docker service to start on boot..."
                    run_with_sudo systemctl enable docker
                fi
                
                # Start Docker service
                run_with_sudo systemctl start docker
                sleep 3
            
            # Check if Docker daemon started successfully
            if docker info >/dev/null 2>&1; then
                print_success "Docker daemon started successfully."
            else
                # Check Docker service status
                print_error "Failed to start Docker daemon."
                print_info "Checking Docker service status..."
                run_with_sudo systemctl status docker --no-pager -l || true
                
                echo ""
                print_info "Troubleshooting steps:"
                echo "  1. Check Docker service: sudo systemctl status docker"
                echo "  2. Check Docker logs: sudo journalctl -u docker.service"
                echo "  3. Try starting manually: sudo systemctl start docker"
                echo "  4. If user permissions issue, ensure you're in docker group:"
                echo "     sudo usermod -aG docker $USER"
                echo "     (then log out and back in)"
                echo ""
                
                # Check if user is in docker group
                if [ "$EUID" -ne 0 ]; then
                    if groups | grep -q docker; then
                        print_info "User is in docker group. Service may need manual intervention."
                    else
                        print_warning "User is not in docker group. Adding user to docker group..."
                        run_with_sudo usermod -aG docker $USER
                        print_warning "User added to docker group. You may need to log out and back in."
                        print_info "Alternatively, try running Docker commands with sudo."
                    fi
                fi
                
                # Try one more time with a longer wait
                print_info "Waiting a bit longer and retrying..."
                sleep 5
                if docker info >/dev/null 2>&1 || sudo docker info >/dev/null 2>&1; then
                    print_success "Docker daemon is now running."
                else
                    print_error "Docker daemon still not running. Please resolve the issue and run the script again."
                    exit 1
                fi
            fi
            else
                print_error "Docker service not found. Docker may not be installed correctly."
                print_info "Please ensure Docker is installed:"
                echo "  sudo apt-get update"
                echo "  sudo apt-get install docker.io"
                echo "  sudo systemctl start docker"
                echo "  sudo systemctl enable docker"
                exit 1
            fi
        fi
    else
        print_success "Docker daemon is running."
    fi
    
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

# Check if domain is proxied through Cloudflare
is_cloudflare_proxied() {
    local domain_ips=$1
    
    if [ -z "$domain_ips" ]; then
        return 1
    fi
    
    # Cloudflare IPv4 ranges (common prefixes)
    # Check if any resolved IP matches known Cloudflare IP ranges
    for ip in $domain_ips; do
        # Extract octets for easier range checking
        IFS='.' read -r o1 o2 o3 o4 <<< "$ip"
        
        # 104.16.0.0/12 (104.16.0.0 - 104.31.255.255)
        if [ "$o1" = "104" ] && [ "$o2" -ge 16 ] && [ "$o2" -le 31 ]; then
            return 0
        fi
        # 104.24.0.0/14 (104.24.0.0 - 104.27.255.255)
        if [ "$o1" = "104" ] && [ "$o2" -ge 24 ] && [ "$o2" -le 27 ]; then
            return 0
        fi
        # 172.64.0.0/13 (172.64.0.0 - 172.71.255.255)
        if [ "$o1" = "172" ] && [ "$o2" -ge 64 ] && [ "$o2" -le 71 ]; then
            return 0
        fi
        # 173.245.48.0/20 (173.245.48.0 - 173.245.63.255)
        if [ "$o1" = "173" ] && [ "$o2" = "245" ] && [ "$o3" -ge 48 ] && [ "$o3" -le 63 ]; then
            return 0
        fi
        # 188.114.96.0/20 (188.114.96.0 - 188.114.111.255)
        if [ "$o1" = "188" ] && [ "$o2" = "114" ] && [ "$o3" -ge 96 ] && [ "$o3" -le 111 ]; then
            return 0
        fi
        # 198.41.128.0/17 (198.41.128.0 - 198.41.255.255)
        if [ "$o1" = "198" ] && [ "$o2" = "41" ] && [ "$o3" -ge 128 ]; then
            return 0
        fi
        # 141.101.64.0/18 (141.101.64.0 - 141.101.127.255)
        if [ "$o1" = "141" ] && [ "$o2" = "101" ] && [ "$o3" -ge 64 ] && [ "$o3" -le 127 ]; then
            return 0
        fi
        # 190.93.240.0/20 (190.93.240.0 - 190.93.255.255)
        if [ "$o1" = "190" ] && [ "$o2" = "93" ] && [ "$o3" -ge 240 ]; then
            return 0
        fi
        # 197.234.240.0/22 (197.234.240.0 - 197.234.243.255)
        if [ "$o1" = "197" ] && [ "$o2" = "234" ] && [ "$o3" -ge 240 ] && [ "$o3" -le 243 ]; then
            return 0
        fi
        # 162.158.0.0/15 (162.158.0.0 - 162.159.255.255)
        if [ "$o1" = "162" ] && [ "$o2" -ge 158 ] && [ "$o2" -le 159 ]; then
            return 0
        fi
    done
    
    return 1
}

# Verify DNS configuration with detailed checks
verify_dns_configuration() {
    local domain=$1
    local public_ip=$2
    local skip_check=${3:-""}
    
    print_info "Verifying domain DNS configuration..."
    
    # Get domain IP addresses (A records)
    local domain_ips=$(dig +short $domain A 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' || echo "")
    local domain_ipv6=$(dig +short $domain AAAA 2>/dev/null | grep -E '^[0-9a-fA-F:]+$' || echo "")
    
    if [ -z "$public_ip" ]; then
        print_error "Could not determine public IP of this server."
        print_info "Please ensure this server can access the internet."
        return 1
    fi
    
    if [ -z "$domain_ips" ]; then
        print_error "Could not resolve domain $domain to an IP address."
        print_info "Please check your DNS configuration:"
        echo "  1. Ensure an A record exists for $domain"
        echo "  2. Wait for DNS propagation (can take up to 48 hours)"
        echo "  3. Verify with: dig +short $domain"
        return 1
    fi
    
    # Check if domain is proxied through Cloudflare
    if is_cloudflare_proxied "$domain_ips"; then
        print_info "Cloudflare proxy detected for domain $domain"
        print_info "  Domain resolves to Cloudflare IPs: $(echo $domain_ips | tr '\n' ' ')"
        print_info "  This is normal when using Cloudflare's proxy/CDN service."
        print_info "  Skipping DNS verification (Cloudflare will proxy requests to your server)."
        print_success "Domain DNS configuration verified (Cloudflare proxy detected)."
        return 0
    fi
    
    # If skip_check is set, skip the IP match verification
    if [ "$skip_check" = "skip" ]; then
        print_warning "Skipping DNS IP verification as requested."
        print_info "  Domain: $domain"
        print_info "  Domain resolves to: $(echo $domain_ips | tr '\n' ' ')"
        print_info "  Server IP: $public_ip"
        print_success "Domain DNS configuration verified (DNS check skipped)."
        return 0
    fi
    
    # Check if any A record matches the server IP
    local ip_match=false
    for ip in $domain_ips; do
        if [ "$ip" = "$public_ip" ]; then
            ip_match=true
            break
        fi
    done
    
    if [ "$ip_match" = "false" ]; then
        print_error "DNS Configuration Mismatch Detected!"
        echo ""
        echo "  Domain: $domain"
        echo "  Domain resolves to: $(echo $domain_ips | tr '\n' ' ')"
        if [ -n "$domain_ipv6" ]; then
            echo "  Domain IPv6: $(echo $domain_ipv6 | tr '\n' ' ')"
        fi
        echo "  This server IP: $public_ip"
        echo ""
        print_warning "The domain does not point to this server. SSL certificate generation will fail."
        echo ""
        print_info "To fix this:"
        echo "  1. Log in to your DNS provider (e.g., Cloudflare, Route53, Namecheap)"
        echo "  2. Update the A record for $domain to point to: $public_ip"
        echo "  3. If using Cloudflare proxy, ensure 'Proxy' is enabled (orange cloud)"
        echo "  4. Wait for DNS propagation (usually 5-60 minutes, can take up to 48 hours)"
        echo "  5. Verify DNS is updated: dig +short $domain"
        echo "  6. Then retry SSL setup with: sudo ./setup.sh --ssl-only $domain"
        echo ""
        print_info "If your domain is behind a proxy/CDN (like Cloudflare), you can skip DNS check:"
        echo "  sudo ./setup.sh --ssl-only $domain --skip-dns-check"
        echo ""
        return 1
    fi
    
    print_success "Domain DNS configuration verified."
    print_info "  Domain: $domain"
    print_info "  Resolves to: $(echo $domain_ips | tr '\n' ' ')"
    print_info "  Server IP: $public_ip"
    return 0
}

# Retry SSL setup (useful after DNS is fixed)
retry_ssl_setup() {
    local domain=$1
    local docker_compose_cmd=$2
    local skip_dns=${3:-""}
    
    if [ -z "$domain" ]; then
        print_error "Domain name is required for SSL retry."
        return 1
    fi
    
    print_info "Retrying SSL certificate setup for domain: $domain"
    
    # Get public IP
    local public_ip=$(curl -s https://api.ipify.org || curl -s https://ifconfig.me || echo "")
    
    # Verify DNS configuration (with optional skip flag)
    local skip_flag=""
    if [ "$skip_dns" = "skip" ]; then
        skip_flag="skip"
    fi
    
    if ! verify_dns_configuration "$domain" "$public_ip" "$skip_flag"; then
        print_error "DNS configuration is still incorrect. Please fix DNS and try again."
        return 1
    fi
    
    # Call setup_ssl with skip_dns_check flag
    setup_ssl "$domain" "$docker_compose_cmd" "skip_dns_check"
}

# Setup SSL with Let's Encrypt
setup_ssl() {
    local domain=$1
    local docker_compose_cmd=$2
    local skip_dns_check=${3:-""}
    
    if [ -z "$domain" ]; then
        print_warning "No domain provided. Skipping SSL setup. Site will be accessible via HTTP only."
        return 0
    fi
    
    print_info "Setting up SSL certificate for domain: $domain"
    
    # Install certbot (without nginx plugin since we're using standalone mode)
    if ! command_exists certbot; then
        print_info "Installing certbot..."
        run_with_sudo apt-get update -qq
        # Install certbot without nginx plugin to avoid installing nginx on host
        run_with_sudo apt-get install -y -qq certbot
    fi
    
    # Install dnsutils if not available (for dig command)
    if ! command_exists dig; then
        print_info "Installing dnsutils for DNS verification..."
        run_with_sudo apt-get update -qq
        run_with_sudo apt-get install -y -qq dnsutils
    fi
    
    # Stop and disable nginx if it was installed (as a dependency or otherwise)
    if systemctl list-units --type=service --state=running 2>/dev/null | grep -q nginx; then
        print_info "Stopping nginx service (if running)..."
        run_with_sudo systemctl stop nginx 2>/dev/null || true
        run_with_sudo systemctl disable nginx 2>/dev/null || true
    fi
    
    # Check if domain resolves to this server (unless skip_dns_check is set)
    local public_ip=$(curl -s https://api.ipify.org || curl -s https://ifconfig.me || echo "")
    
    if [ "$skip_dns_check" != "skip_dns_check" ]; then
        if ! verify_dns_configuration "$domain" "$public_ip"; then
            echo ""
            print_info "What would you like to do?"
            echo "  1) Fix DNS now and retry SSL setup"
            echo "  2) Continue anyway (will likely fail)"
            echo "  3) Skip SSL setup for now"
            echo ""
            read -p "Enter your choice (1-3): " -n 1 -r
            echo ""
            
            case $REPLY in
                1)
                    print_info "Waiting for you to fix DNS configuration..."
                    print_info "After updating DNS, wait a few minutes for propagation, then run:"
                    print_info "  sudo ./setup.sh --ssl-only $domain"
                    echo ""
                    read -p "Press Enter when DNS is updated and you're ready to retry..."
                    if retry_ssl_setup "$domain" "$docker_compose_cmd"; then
                        return 0
                    else
                        print_error "SSL setup still failed. Please verify DNS configuration."
                        return 1
                    fi
                    ;;
                2)
                    print_warning "Continuing with SSL setup despite DNS mismatch. This will likely fail."
                    ;;
                3)
                    print_warning "Skipping SSL setup. You can set it up later with:"
                    print_warning "  sudo ./setup.sh --ssl-only $domain"
                    return 0
                    ;;
                *)
                    print_warning "Invalid choice. Skipping SSL setup."
                    return 0
                    ;;
            esac
        else
            # DNS is correct, proceed automatically
            print_info "DNS configuration verified. Proceeding with automatic SSL setup..."
        fi
    fi
    
    # Auto-generate nginx-ssl.conf if template exists and domain is provided
    if [ -f "nginx-ssl.conf.template" ] && [ -n "$domain" ]; then
        if [ ! -f "nginx-ssl.conf" ] || [ "nginx-ssl.conf.template" -nt "nginx-ssl.conf" ]; then
            print_info "Generating nginx-ssl.conf from template..."
            sed "s/__DOMAIN__/$domain/g" nginx-ssl.conf.template > nginx-ssl.conf
            print_success "nginx-ssl.conf generated successfully."
        fi
    fi
    
    # Create directory for SSL certificates
    run_with_sudo mkdir -p /etc/letsencrypt/live/$domain
    run_with_sudo mkdir -p /etc/letsencrypt/archive/$domain
    
    # Generate certificate using standalone mode (since nginx isn't running yet)
    print_info "Generating SSL certificate..."
    
    # Stop any running containers temporarily for certbot (port 80 must be free)
    print_info "Stopping any running containers to free port 80 for certbot..."
    $docker_compose_cmd down 2>/dev/null || true
    
    # Stop host nginx service if it's running (installed as certbot dependency)
    if systemctl is-active --quiet nginx 2>/dev/null; then
        print_info "Stopping host nginx service to free port 80..."
        run_with_sudo systemctl stop nginx
        # Disable nginx from auto-starting (we're using Docker)
        run_with_sudo systemctl disable nginx 2>/dev/null || true
    fi
    
    # Check for any other process using port 80
    if command_exists lsof; then
        if run_with_sudo lsof -i :80 >/dev/null 2>&1; then
            print_warning "Port 80 is still in use. Attempting to identify and stop the process..."
            run_with_sudo lsof -i :80 | tail -n +2 | awk '{print $2}' | xargs -r run_with_sudo kill -9 2>/dev/null || true
        fi
    elif command_exists netstat; then
        if run_with_sudo netstat -tuln | grep -q ":80 "; then
            print_warning "Port 80 appears to be in use. Please manually stop any service using port 80."
        fi
    fi
    
    # Wait a moment for ports to be released
    sleep 3
    
    # Verify port 80 is free
    print_info "Verifying port 80 is available..."
    if command_exists lsof; then
        if run_with_sudo lsof -i :80 >/dev/null 2>&1; then
            print_error "Port 80 is still in use. Cannot proceed with SSL certificate generation."
            print_info "Processes using port 80:"
            run_with_sudo lsof -i :80 || true
            return 1
        fi
    elif command_exists ss; then
        if run_with_sudo ss -tuln | grep -q ":80 "; then
            print_error "Port 80 is still in use. Cannot proceed with SSL certificate generation."
            return 1
        fi
    fi
    print_success "Port 80 is available."
    
    # Generate certificate
    print_info "Requesting SSL certificate from Let's Encrypt..."
    if run_with_sudo certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email admin@$domain \
        --domains $domain \
        --preferred-challenges http \
        --keep-until-expiring; then
        
        # Verify certificate files exist
        if [ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/$domain/privkey.pem" ]; then
            print_success "SSL certificate generated successfully!"
            print_info "Certificate location: /etc/letsencrypt/live/$domain/"
            
            # Set up auto-renewal
            print_info "Setting up SSL certificate auto-renewal..."
            local renew_hook="$docker_compose_cmd restart web || true"
            (run_with_sudo crontab -l 2>/dev/null | grep -v "certbot renew" | grep -v "# Yukon Commerce SSL renewal"; echo "0 0 * * * certbot renew --quiet --deploy-hook '$renew_hook' # Yukon Commerce SSL renewal") | run_with_sudo crontab - || true
            
            return 0
        else
            print_error "Certificate files not found after generation."
            print_error "Expected files:"
            echo "  - /etc/letsencrypt/live/$domain/fullchain.pem"
            echo "  - /etc/letsencrypt/live/$domain/privkey.pem"
            return 1
        fi
    else
        print_error "Failed to generate SSL certificate."
        echo ""
        print_info "Common causes:"
        echo "  1. Domain DNS not pointing to this server"
        echo "  2. Port 80 not accessible from the internet"
        echo "  3. Firewall blocking port 80"
        echo "  4. Rate limiting from Let's Encrypt (too many requests)"
        echo ""
        print_info "To troubleshoot:"
        echo "  1. Verify DNS: dig +short $domain"
        echo "  2. Check firewall: sudo ufw status"
        echo "  3. Test port 80: curl -I http://$domain"
        echo "  4. Check certbot logs: sudo cat /var/log/letsencrypt/letsencrypt.log"
        echo ""
        print_warning "You can retry SSL setup later with:"
        print_warning "  sudo ./setup.sh --ssl-only $domain"
        return 1
    fi
}

# Verify and generate configuration files
verify_config_files() {
    print_info "Verifying configuration files..."
    
    local config_errors=()
    
    # Check nginx.conf exists
    if [ ! -f "nginx.conf" ]; then
        print_warning "nginx.conf not found. Creating default configuration..."
        cat > nginx.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle React Router (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINX_EOF
        print_success "Created nginx.conf"
    else
        print_success "nginx.conf exists"
    fi
    
    # Check docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        config_errors+=("docker-compose.yml")
    else
        print_success "docker-compose.yml exists"
    fi
    
    # Check docker-compose.ssl.yml exists (optional, but needed for SSL)
    if [ ! -f "docker-compose.ssl.yml" ]; then
        print_warning "docker-compose.ssl.yml not found. SSL deployment will not be available."
    else
        print_success "docker-compose.ssl.yml exists"
    fi
    
    # Check nginx-ssl.conf.template exists (needed for SSL)
    if [ ! -f "nginx-ssl.conf.template" ]; then
        print_warning "nginx-ssl.conf.template not found. SSL configuration may not work properly."
    else
        print_success "nginx-ssl.conf.template exists"
    fi
    
    if [ ${#config_errors[@]} -gt 0 ]; then
        print_error "Missing required configuration files: ${config_errors[*]}"
        return 1
    fi
    
    return 0
}

# Check and setup environment variables
setup_environment() {
    print_info "Checking environment variables..."
    
    ENV_FILE=".env"
    REQUIRED_VARS=("VITE_SUPABASE_URL" "VITE_SUPABASE_PUBLISHABLE_KEY")
    OPTIONAL_VARS=()
    
    if [ ! -f "$ENV_FILE" ]; then
        print_warning ".env file not found. Creating template..."
        
        cat > "$ENV_FILE" << EOF
# Supabase Configuration
# Replace these values with your Supabase project credentials
# You can find these in your Supabase project settings: https://app.supabase.com/project/_/settings/api

VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

# Optional: Additional environment variables can be added here
# These will be available during the build process
EOF
        
        print_success "Created .env file with template variables."
        print_info "You can find your Supabase credentials at: https://app.supabase.com/project/_/settings/api"
        
        # Check if we should continue
        echo ""
        read -p "Do you want to continue without Supabase credentials? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Please edit .env file and add your Supabase credentials, then run this script again."
            print_info "You can edit the file with: nano .env"
            exit 0
        fi
        print_warning "Continuing without Supabase credentials. Application may not function correctly."
    else
        print_success ".env file exists."
        
        # Check if required variables are set
        MISSING_VARS=()
        MISSING_OPTIONAL_VARS=()
        
        # Load variables from .env file safely
        set +e
        # Use set -a to automatically export variables
        set -a
        source "$ENV_FILE" 2>/dev/null || true
        set +a
        set -e
        
        for var in "${REQUIRED_VARS[@]}"; do
            if [ -z "${!var}" ]; then
                MISSING_VARS+=("$var")
            fi
        done
        
        for var in "${OPTIONAL_VARS[@]}"; do
            if [ -z "${!var}" ]; then
                MISSING_OPTIONAL_VARS+=("$var")
            fi
        done
        
        if [ ${#MISSING_VARS[@]} -gt 0 ]; then
            print_error "The following REQUIRED environment variables are missing or empty:"
            for var in "${MISSING_VARS[@]}"; do
                echo "  - $var"
            done
            echo ""
            print_warning "Application will NOT function correctly without these variables."
            print_info "Please edit .env file and add the missing variables."
            print_info "You can edit the file with: nano .env"
            echo ""
            read -p "Do you want to continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_info "Please edit .env file and run this script again."
                exit 0
            fi
        else
            print_success "All required environment variables are set."
        fi
        
        if [ ${#MISSING_OPTIONAL_VARS[@]} -gt 0 ]; then
            print_info "The following optional environment variables are not set:"
            for var in "${MISSING_OPTIONAL_VARS[@]}"; do
                echo "  - $var"
            done
        fi
    fi
}

# Setup and verify database
setup_database() {
    print_info "Setting up database..."
    
    # Check if PostgreSQL container exists
    if ! docker ps -a --format '{{.Names}}' | grep -q "^yukon-commerce-db$"; then
        print_info "PostgreSQL container not found. It will be created during deployment."
        return 0
    fi
    
    # Check if PostgreSQL container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^yukon-commerce-db$"; then
        print_info "PostgreSQL container exists but is not running. Starting container..."
        docker start yukon-commerce-db || true
        sleep 5
    fi
    
    # Wait for database to be ready
    print_info "Waiting for database to be ready..."
    local max_attempts=30
    local attempt=0
    local db_ready=false
    
    # Load database credentials from environment or use defaults
    local db_user="${POSTGRES_USER:-postgres}"
    local db_password="${POSTGRES_PASSWORD:-postgres}"
    local db_name="${POSTGRES_DB:-yukon_commerce}"
    
    while [ $attempt -lt $max_attempts ]; do
        if docker exec yukon-commerce-db pg_isready -U "$db_user" -d "$db_name" >/dev/null 2>&1; then
            db_ready=true
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    if [ "$db_ready" = "false" ]; then
        print_warning "Database did not become ready within expected time."
        print_info "This may be normal if the database is still initializing."
        return 1
    fi
    
    print_success "Database is ready."
    
    # Verify database initialization by checking if tables exist
    print_info "Verifying database initialization..."
    local table_count=$(docker exec yukon-commerce-db psql -U "$db_user" -d "$db_name" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null || echo "0")
    
    if [ "$table_count" -gt 0 ]; then
        print_success "Database initialized successfully. Found $table_count table(s)."
        
        # List key tables
        print_info "Key tables in database:"
        docker exec yukon-commerce-db psql -U "$db_user" -d "$db_name" -tAc "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;" 2>/dev/null | head -10 | while read -r table; do
            if [ -n "$table" ]; then
                echo "  - $table"
            fi
        done || true
    else
        print_warning "Database appears to be empty or initialization may still be in progress."
        print_info "If this is the first run, initialization scripts will run automatically."
    fi
    
    return 0
}

# Pre-deployment checks
pre_deployment_checks() {
    print_info "Running pre-deployment checks..."
    
    local checks_passed=true
    
    # Check disk space (need at least 2GB free)
    print_info "Checking disk space..."
    local available_space=$(df -BG / | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$available_space" -lt 2 ]; then
        print_warning "Low disk space: ${available_space}GB available. Recommended: at least 2GB"
        checks_passed=false
    else
        print_success "Sufficient disk space available: ${available_space}GB"
    fi
    
    # Check network connectivity
    print_info "Checking network connectivity..."
    if curl -s --max-time 5 https://www.google.com >/dev/null 2>&1 || curl -s --max-time 5 https://www.cloudflare.com >/dev/null 2>&1; then
        print_success "Network connectivity verified"
    else
        print_warning "Network connectivity check failed. Internet access may be limited."
        checks_passed=false
    fi
    
    # Verify Docker can build images
    print_info "Verifying Docker build capability..."
    if docker info >/dev/null 2>&1; then
        print_success "Docker is ready for builds"
    else
        print_error "Docker is not ready. Please check Docker installation."
        checks_passed=false
    fi
    
    # Check if .env file has required variables (if file exists)
    if [ -f ".env" ]; then
        print_info "Verifying environment variables..."
        set +e
        source .env 2>/dev/null || true
        set -e
        
        if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_PUBLISHABLE_KEY" ]; then
            print_warning "Required environment variables may be missing. Application may not function correctly."
        else
            print_success "Required environment variables are set"
        fi
    fi
    
    # Verify configuration files
    if ! verify_config_files; then
        print_warning "Some configuration files are missing or invalid"
        checks_passed=false
    fi
    
    if [ "$checks_passed" = "false" ]; then
        print_warning "Some pre-deployment checks failed, but continuing anyway..."
        return 1
    else
        print_success "All pre-deployment checks passed"
        return 0
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
    print_info "Memory optimizations enabled: Node.js heap size set to 1536MB"
    print_info "Build progress will be shown below. If build hangs, check server memory."
    echo ""
    
    # Build with progress output
    if $DOCKER_COMPOSE_CMD build --progress=plain; then
        print_success "Docker image built successfully!"
    else
        print_error "Failed to build Docker image."
        echo ""
        print_info "If the build failed due to memory issues, try:"
        echo "  1. Check available memory: free -h"
        echo "  2. Free up memory by stopping other services"
        echo "  3. Consider increasing server memory or using a build server"
        exit 1
    fi
    
    # Determine which compose file to use
    local compose_file="docker-compose.yml"
    if [ "$use_ssl" = "true" ] && [ -f "docker-compose.ssl.yml" ]; then
        compose_file="docker-compose.ssl.yml"
        print_info "Using SSL-enabled Docker Compose configuration."
        
        # Create nginx-ssl.conf from template if domain is provided
        if [ -f "nginx-ssl.conf.template" ] && [ -n "$domain" ]; then
            if [ ! -f "nginx-ssl.conf" ] || [ "nginx-ssl.conf.template" -nt "nginx-ssl.conf" ]; then
                print_info "Configuring nginx SSL configuration for domain: $domain"
                sed "s/__DOMAIN__/$domain/g" nginx-ssl.conf.template > nginx-ssl.conf
                print_success "nginx-ssl.conf generated successfully."
            else
                print_info "nginx-ssl.conf already exists and is up to date."
            fi
        elif [ ! -f "nginx-ssl.conf" ]; then
            print_error "nginx-ssl.conf.template not found. Cannot configure SSL."
            print_error "Please ensure nginx-ssl.conf.template exists in the project directory."
            exit 1
        fi
        
        # Verify SSL certificate files exist
        if [ ! -f "/etc/letsencrypt/live/$domain/fullchain.pem" ] || [ ! -f "/etc/letsencrypt/live/$domain/privkey.pem" ]; then
            print_error "SSL certificate files not found for domain: $domain"
            print_error "Expected files:"
            echo "  - /etc/letsencrypt/live/$domain/fullchain.pem"
            echo "  - /etc/letsencrypt/live/$domain/privkey.pem"
            print_info "Please run SSL setup first: sudo ./setup.sh --ssl-only $domain"
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

# Update from GitHub repository
update_from_github() {
    print_info "Checking for updates from GitHub..."
    
    # Check if git is installed
    if ! command_exists git; then
        print_warning "Git is not installed. Skipping repository update."
        print_info "Git will be installed during dependency check."
        return 0
    fi
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        print_info "Not a git repository. Skipping update."
        return 0
    fi
    
    # Check if remote origin exists
    if ! git remote get-url origin >/dev/null 2>&1; then
        print_info "No remote origin configured. Skipping update."
        return 0
    fi
    
    # Get current branch
    local current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
    if [ -z "$current_branch" ]; then
        print_warning "Could not determine current branch. Skipping update."
        return 0
    fi
    
    print_info "Current branch: $current_branch"
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        print_warning "You have uncommitted changes in your working directory."
        print_info "Attempting to pull updates (this may cause conflicts)..."
    fi
    
    # Fetch latest changes
    print_info "Fetching latest changes from origin..."
    if ! git fetch origin "$current_branch" 2>/dev/null; then
        print_warning "Failed to fetch updates from GitHub. Continuing with current version."
        print_info "This may be due to network issues or authentication problems."
        return 0
    fi
    
    # Check if there are updates available
    local local_commit=$(git rev-parse HEAD 2>/dev/null)
    local remote_commit=$(git rev-parse "origin/$current_branch" 2>/dev/null)
    
    if [ -z "$local_commit" ] || [ -z "$remote_commit" ]; then
        print_warning "Could not determine commit status. Skipping update."
        return 0
    fi
    
    if [ "$local_commit" = "$remote_commit" ]; then
        print_success "Repository is already up to date."
        return 0
    fi
    
    # Count commits ahead
    local commit_count=$(git rev-list --count HEAD.."origin/$current_branch" 2>/dev/null || echo "0")
    
    # Pull updates
    print_info "Pulling latest changes..."
    if git pull origin "$current_branch" 2>/dev/null; then
        print_success "Successfully updated from GitHub!"
        if [ "$commit_count" != "0" ] && [ "$commit_count" != "" ]; then
            print_info "Updated with $commit_count new commit(s)."
        fi
    else
        print_warning "Failed to pull updates. This may be due to merge conflicts."
        print_info "You may need to resolve conflicts manually or stash your changes."
        print_info "Continuing with current version..."
        return 0
    fi
}

# Main execution
main() {
    # Check script integrity first (line endings, etc.)
    check_script_integrity
    
    # Handle --ssl-only flag for retrying SSL setup
    if [ "$1" = "--ssl-only" ] || [ "$1" = "-s" ]; then
        if [ -z "$2" ]; then
            print_error "Domain name is required for SSL-only setup."
            echo ""
            print_info "Usage: sudo ./setup.sh --ssl-only <domain> [--skip-dns-check]"
            echo "Example: sudo ./setup.sh --ssl-only example.com"
            echo "Example: sudo ./setup.sh --ssl-only example.com --skip-dns-check"
            exit 1
        fi
        
        local domain=$2
        local skip_dns=""
        
        # Check for --skip-dns-check flag
        if [ "$3" = "--skip-dns-check" ]; then
            skip_dns="skip"
            print_info "DNS check will be skipped as requested."
        fi
        
        echo ""
        print_info "=========================================="
        print_info "SSL Certificate Setup Only"
        print_info "=========================================="
        echo ""
        
        # Check for root/sudo
        if ! is_root_or_sudo; then
            print_error "This script requires root privileges or sudo access."
            print_error "Please run with: sudo ./setup.sh --ssl-only $domain"
            exit 1
        fi
        
        # Update from GitHub (non-blocking)
        update_from_github || true
        
        # Check Docker Compose (needed for retry_ssl_setup)
        check_docker_compose
        
        # Retry SSL setup
        if retry_ssl_setup "$domain" "$DOCKER_COMPOSE_CMD" "$skip_dns"; then
            print_success "SSL certificate setup completed successfully!"
            echo ""
            print_info "Next steps:"
            echo "  1. If containers are running, restart them to use SSL:"
            echo "     $DOCKER_COMPOSE_CMD -f docker-compose.ssl.yml down"
            echo "     $DOCKER_COMPOSE_CMD -f docker-compose.ssl.yml up -d"
            echo "  2. Or run the full deployment: sudo ./setup.sh"
            exit 0
        else
            print_error "SSL certificate setup failed."
            exit 1
        fi
    fi
    
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
    
    # Step 0: Update from GitHub (non-blocking)
    update_from_github || true
    
    # Step 1: Install Docker
    install_docker
    
    # Step 2: Check and install system dependencies
    check_system_dependencies
    
    # Step 3: Check Docker Compose and Docker daemon
    check_docker_compose
    
    # Step 3.5: Setup database (after Docker Compose is verified)
    setup_database || true  # Don't fail if database setup has issues, it will be handled during deployment
    
    # Step 4: Verify ports 80 and 443
    verify_ports || true  # Don't fail if ports are in use, we'll handle it during deployment
    
    # Step 5: Configure firewall
    configure_firewall
    
    # Step 6: Verify configuration files
    verify_config_files || true  # Don't fail, we'll create missing files
    
    # Step 7: Setup environment variables
    setup_environment
    
    # Step 8: Pre-deployment checks
    pre_deployment_checks || true  # Warn but don't fail
    
    # Step 9: Ask for domain (optional)
    echo ""
    read -p "Enter your domain name (or press Enter to skip SSL setup): " DOMAIN
    DOMAIN=$(echo "$DOMAIN" | xargs) # Trim whitespace
    
    USE_SSL="false"
    if [ -n "$DOMAIN" ]; then
        USE_SSL="true"
        # Setup SSL (will be automatic if DNS is correct)
        setup_ssl "$DOMAIN" "$DOCKER_COMPOSE_CMD"
        # Update SSL status based on certificate generation
        if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
            USE_SSL="false"
            print_warning "SSL certificate not found. Continuing with HTTP only."
            print_info "You can retry SSL setup later with:"
            print_info "  sudo ./setup.sh --ssl-only $DOMAIN"
        else
            # Ensure nginx-ssl.conf is generated for SSL deployment
            if [ -f "nginx-ssl.conf.template" ] && [ -n "$DOMAIN" ]; then
                if [ ! -f "nginx-ssl.conf" ] || [ "nginx-ssl.conf.template" -nt "nginx-ssl.conf" ]; then
                    print_info "Generating nginx-ssl.conf from template..."
                    sed "s/__DOMAIN__/$DOMAIN/g" nginx-ssl.conf.template > nginx-ssl.conf
                fi
            fi
        fi
    fi
    
    # Step 10: Deploy with Docker
    deploy_with_docker "$DOMAIN" "$USE_SSL"
    
    print_success "Setup completed successfully!"
}

# Run main function with all arguments
main "$@"
