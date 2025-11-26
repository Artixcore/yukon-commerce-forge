#!/bin/bash

# Database Migration Script
# This script allows manual execution of database migrations
# Useful for applying new migrations after initial setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Container name can be overridden via DB_CONTAINER_NAME environment variable
DB_CONTAINER_NAME="${DB_CONTAINER_NAME:-yukon-commerce-db}"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if PostgreSQL container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${DB_CONTAINER_NAME}$"; then
    print_error "PostgreSQL container '${DB_CONTAINER_NAME}' not found."
    print_info "Please start the database container first:"
    echo "  docker-compose up -d postgres"
    echo "  Or set DB_CONTAINER_NAME environment variable if using a different container name"
    exit 1
fi

# Check if PostgreSQL container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER_NAME}$"; then
    print_info "PostgreSQL container is not running. Starting it..."
    docker start "${DB_CONTAINER_NAME}"
    sleep 5
fi

# Load database credentials from environment or use defaults
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
DB_NAME="${POSTGRES_DB:-yukon_commerce}"

# Wait for database to be ready
print_info "Waiting for database to be ready..."
max_attempts=30
attempt=0
db_ready=false

while [ $attempt -lt $max_attempts ]; do
    if docker exec "${DB_CONTAINER_NAME}" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        db_ready=true
        break
    fi
    attempt=$((attempt + 1))
    sleep 2
done

if [ "$db_ready" = "false" ]; then
    print_error "Database did not become ready within expected time."
    exit 1
fi

print_success "Database is ready."

# Check if migration directory exists
MIGRATIONS_DIR="supabase/migrations"
if [ ! -d "$MIGRATIONS_DIR" ]; then
    print_warning "Migrations directory not found: $MIGRATIONS_DIR"
    print_info "No migrations to apply."
    exit 0
fi

# Get list of migration files
MIGRATION_FILES=$(find "$MIGRATIONS_DIR" -name "*.sql" -type f | sort)

if [ -z "$MIGRATION_FILES" ]; then
    print_info "No migration files found in $MIGRATIONS_DIR"
    exit 0
fi

print_info "Found migration files. Checking which ones need to be applied..."

# Create migrations tracking table if it doesn't exist
docker exec "${DB_CONTAINER_NAME}" psql -U "$DB_USER" -d "$DB_NAME" <<EOF >/dev/null 2>&1 || true
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
EOF

# Apply each migration
for migration_file in $MIGRATION_FILES; do
    migration_name=$(basename "$migration_file")
    
    # Escape single quotes in migration name to prevent SQL injection
    # Replace each single quote with two single quotes (SQL standard escaping)
    escaped_migration_name=$(echo "$migration_name" | sed "s/'/''/g")
    
    # Check if migration has already been applied using safely escaped value
    # Use psql's -tAc to get a single value safely
    migration_check=$(docker exec "${DB_CONTAINER_NAME}" psql -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT 1 FROM schema_migrations WHERE version = '${escaped_migration_name}';" 2>/dev/null || echo "")
    
    if [ "$migration_check" = "1" ]; then
        print_info "Skipping already applied migration: $migration_name"
        continue
    fi
    
    print_info "Applying migration: $migration_name"
    
    # Apply migration
    if docker exec -i "${DB_CONTAINER_NAME}" psql -U "$DB_USER" -d "$DB_NAME" < "$migration_file"; then
        # Record migration using safely escaped name
        docker exec "${DB_CONTAINER_NAME}" psql -U "$DB_USER" -d "$DB_NAME" -c "INSERT INTO schema_migrations (version) VALUES ('${escaped_migration_name}') ON CONFLICT (version) DO NOTHING;" >/dev/null 2>&1
        print_success "Applied migration: $migration_name"
    else
        print_error "Failed to apply migration: $migration_name"
        exit 1
    fi
done

print_success "All migrations applied successfully!"

# Show current schema version
print_info "Current database schema:"
docker exec "${DB_CONTAINER_NAME}" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT version, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 5;" 2>/dev/null || true

