# Database Documentation

## Overview

The Yukon Commerce application uses PostgreSQL as its database. The database is containerized using Docker and initialized automatically with all required schema, tables, functions, triggers, and Row Level Security (RLS) policies.

## Database Connection

### Default Credentials

- **User**: `postgres`
- **Password**: `postgres`
- **Database**: `yukon_commerce`
- **Port**: `5432`
- **Host**: `postgres` (within Docker network) or `localhost` (from host machine)

### Connection String

```
postgresql://postgres:postgres@postgres:5432/yukon_commerce
```

For host machine access:
```
postgresql://postgres:postgres@localhost:5432/yukon_commerce
```

### Environment Variables

The following environment variables can be set in your `.env` file to customize database credentials:

- `POSTGRES_USER` - Database user (default: `postgres`)
- `POSTGRES_PASSWORD` - Database password (default: `postgres`)
- `POSTGRES_DB` - Database name (default: `yukon_commerce`)
- `POSTGRES_PORT` - External port mapping (default: `5432`)
- `DATABASE_URL` - Full connection string

## Database Schema

### Tables

#### `categories`
Product categories with hierarchical support.

**Columns:**
- `id` (UUID, Primary Key)
- `name` (TEXT, Unique, Not Null)
- `slug` (TEXT, Unique, Not Null)
- `description` (TEXT)
- `image_url` (TEXT)
- `parent_id` (UUID, Foreign Key to categories.id)
- `level` (INTEGER, Not Null, Default: 0)
- `created_at` (TIMESTAMPTZ, Not Null)
- `updated_at` (TIMESTAMPTZ, Not Null)

**Constraints:**
- Maximum category depth: 3 levels (0, 1, 2)
- Unique constraint on `name` and `slug`

#### `products`
Products with variants, ratings, and discounts.

**Columns:**
- `id` (UUID, Primary Key)
- `name` (TEXT, Not Null)
- `slug` (TEXT, Unique, Not Null)
- `description` (TEXT)
- `price` (DECIMAL(10,2), Not Null)
- `original_price` (NUMERIC)
- `discount_percentage` (INTEGER)
- `category_id` (UUID, Foreign Key to categories.id)
- `image_url` (TEXT)
- `images` (TEXT[], Default: [])
- `stock_quantity` (INTEGER, Not Null, Default: 0)
- `is_featured` (BOOLEAN, Default: false)
- `is_active` (BOOLEAN, Default: true)
- `rating` (NUMERIC(3,2))
- `review_count` (INTEGER, Default: 0)
- `colors` (JSONB, Default: [])
- `sizes` (JSONB, Default: [])
- `size_chart` (JSONB, Default: [])
- `created_at` (TIMESTAMPTZ, Not Null)
- `updated_at` (TIMESTAMPTZ, Not Null)

**Constraints:**
- `discount_percentage` must be between 0 and 100 (if set)
- `rating` must be between 0 and 5 (if set)

#### `orders`
Customer orders with Bangladesh-specific fields.

**Columns:**
- `id` (UUID, Primary Key)
- `order_number` (TEXT, Unique, Not Null)
- `customer_name` (TEXT, Not Null)
- `customer_email` (TEXT)
- `customer_phone` (TEXT)
- `shipping_address` (TEXT, Not Null)
- `city` (TEXT, Not Null, Default: '')
- `delivery_location` (TEXT, Not Null, Default: 'inside_dhaka')
- `message` (TEXT)
- `total_amount` (DECIMAL(10,2), Not Null)
- `delivery_charge` (NUMERIC, Not Null, Default: 60)
- `status` (order_status ENUM, Not Null, Default: 'pending')
- `created_at` (TIMESTAMPTZ, Not Null)
- `updated_at` (TIMESTAMPTZ, Not Null)

**Constraints:**
- `delivery_location` must be either 'inside_dhaka' or 'outside_dhaka'

#### `order_items`
Order line items with product variants.

**Columns:**
- `id` (UUID, Primary Key)
- `order_id` (UUID, Foreign Key to orders.id, Not Null)
- `product_id` (UUID, Foreign Key to products.id)
- `product_name` (TEXT, Not Null)
- `product_color` (TEXT)
- `product_size` (TEXT)
- `quantity` (INTEGER, Not Null)
- `price` (DECIMAL(10,2), Not Null)
- `created_at` (TIMESTAMPTZ, Not Null)

#### `user_roles`
User role management for admin access.

**Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users.id, Not Null)
- `role` (app_role ENUM, Not Null, Default: 'customer')
- `created_at` (TIMESTAMPTZ, Not Null)

**Constraints:**
- Unique constraint on (`user_id`, `role`)

#### `hero_banners`
Carousel banner system for homepage.

**Columns:**
- `id` (UUID, Primary Key)
- `title` (TEXT, Not Null)
- `subtitle` (TEXT)
- `image_url` (TEXT, Not Null)
- `link_url` (TEXT)
- `button_text` (TEXT)
- `display_order` (INTEGER, Not Null, Default: 0)
- `is_active` (BOOLEAN, Default: true)
- `created_at` (TIMESTAMPTZ, Not Null)
- `updated_at` (TIMESTAMPTZ, Not Null)

#### `reviews`
Product reviews with approval system.

**Columns:**
- `id` (UUID, Primary Key)
- `product_id` (UUID, Foreign Key to products.id, Not Null)
- `customer_name` (TEXT, Not Null)
- `customer_email` (TEXT)
- `rating` (INTEGER, Not Null)
- `review_text` (TEXT)
- `is_approved` (BOOLEAN, Default: false, Not Null)
- `created_at` (TIMESTAMPTZ, Not Null)
- `updated_at` (TIMESTAMPTZ, Not Null)

**Constraints:**
- `rating` must be between 1 and 5

#### `gallery_images`
Image gallery for showcasing products.

**Columns:**
- `id` (UUID, Primary Key)
- `image_url` (TEXT, Not Null)
- `title` (TEXT)
- `display_order` (INTEGER, Not Null, Default: 0)
- `is_active` (BOOLEAN, Default: true)
- `created_at` (TIMESTAMPTZ, Not Null)
- `updated_at` (TIMESTAMPTZ, Not Null)

#### `meta_settings`
Meta API configuration (singleton pattern).

**Columns:**
- `id` (UUID, Primary Key, Default: '00000000-0000-0000-0000-000000000001')
- `pixel_id` (TEXT, Not Null)
- `access_token` (TEXT, Not Null)
- `test_event_code` (TEXT)
- `is_active` (BOOLEAN, Default: true)
- `created_at` (TIMESTAMPTZ, Default: NOW())
- `updated_at` (TIMESTAMPTZ, Default: NOW())

**Constraints:**
- Only one row allowed (singleton pattern)

### Custom Types

#### `app_role` ENUM
User role types:
- `admin`
- `customer`

#### `order_status` ENUM
Order status values:
- `pending`
- `confirmed`
- `processing`
- `shipped`
- `delivered`
- `cancelled`

### Functions

#### `update_updated_at_column()`
Automatically updates the `updated_at` timestamp when a row is updated.

#### `is_admin()`
Checks if the current user has admin role. Returns boolean.

#### `update_category_level()`
Automatically calculates and sets the category level based on parent hierarchy.

#### `update_product_rating()`
Recalculates product rating and review count when reviews are inserted, updated, or deleted.

#### `update_product_stock_on_order()`
Automatically decreases product stock quantity when order items are created.

#### `create_admin_user(user_uuid UUID)`
Helper function to create an admin user role.

#### `set_user_context(user_uuid UUID)`
Helper function to set the current user context for testing/admin operations.

### Triggers

- **Updated_at triggers**: Automatically update `updated_at` timestamp on all tables
- **Category level trigger**: Maintains category hierarchy levels
- **Product rating trigger**: Updates product ratings when reviews change
- **Stock update trigger**: Decreases product stock when orders are placed

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

- **Public read access**: Categories, active products, active banners, approved reviews, active gallery images
- **Public write access**: Orders, order items, reviews (insert only)
- **Admin access**: Full CRUD access for admins on all tables
- **User-specific access**: Users can view their own roles

## Database Initialization

The database is automatically initialized when the PostgreSQL container starts for the first time. Initialization scripts are located in the `init-db/` directory:

1. `01-init-schema.sql` - Creates all tables, types, functions, triggers, and RLS policies
2. `02-setup-auth.sql` - Sets up simplified auth schema for local development

### Manual Initialization

If you need to manually initialize the database:

```bash
# Start the database container
docker-compose up -d postgres

# Wait for initialization (usually takes 10-30 seconds)
docker logs -f yukon-commerce-db
```

## Migrations

### Running Migrations

To apply new migrations manually:

```bash
./scripts/migrate-db.sh
```

This script will:
1. Check if the database container is running
2. Wait for the database to be ready
3. Apply any new migrations from `supabase/migrations/`
4. Track applied migrations in `schema_migrations` table

### Creating New Migrations

1. Create a new SQL file in `supabase/migrations/` with the format:
   ```
   YYYYMMDDHHMMSS_description.sql
   ```

2. Write your migration SQL in the file

3. Run the migration script:
   ```bash
   ./scripts/migrate-db.sh
   ```

## Database Management

### Accessing the Database

**From host machine:**
```bash
docker exec -it yukon-commerce-db psql -U postgres -d yukon_commerce
```

**Using connection string:**
```bash
psql postgresql://postgres:postgres@localhost:5432/yukon_commerce
```

### Common Operations

**View all tables:**
```sql
\dt
```

**View table structure:**
```sql
\d table_name
```

**View database size:**
```sql
SELECT pg_size_pretty(pg_database_size('yukon_commerce'));
```

**Backup database:**
```bash
docker exec yukon-commerce-db pg_dump -U postgres yukon_commerce > backup.sql
```

**Restore database:**
```bash
docker exec -i yukon-commerce-db psql -U postgres yukon_commerce < backup.sql
```

### Data Persistence

Database data is persisted in a Docker volume named `postgres_data`. This ensures data survives container restarts and removals.

To remove all data (⚠️ **Warning: This deletes all data**):
```bash
docker-compose down -v
```

## Authentication

For local development, a simplified auth schema is created that mimics Supabase's `auth.users` table. The `auth.uid()` function returns the current user ID from the session context.

**Note**: In production with Supabase, the auth schema is managed by Supabase and this simplified version should not be used.

### Setting User Context (for testing)

```sql
SELECT set_user_context('user-uuid-here');
```

### Creating Admin User

```sql
-- First, create a user in auth.users (or use existing Supabase user)
INSERT INTO auth.users (id, email) VALUES ('user-uuid', 'admin@example.com');

-- Then assign admin role
SELECT create_admin_user('user-uuid');
```

## Troubleshooting

### Database Container Won't Start

1. Check Docker logs:
   ```bash
   docker logs yukon-commerce-db
   ```

2. Verify port 5432 is not in use:
   ```bash
   lsof -i :5432
   ```

3. Check disk space:
   ```bash
   df -h
   ```

### Migration Errors

1. Check migration logs:
   ```bash
   docker logs yukon-commerce-db | grep -i error
   ```

2. Verify migration files are valid SQL:
   ```bash
   docker exec yukon-commerce-db psql -U postgres -d yukon_commerce -f /path/to/migration.sql
   ```

### Connection Issues

1. Verify container is running:
   ```bash
   docker ps | grep yukon-commerce-db
   ```

2. Test connection:
   ```bash
   docker exec yukon-commerce-db pg_isready -U postgres
   ```

3. Check network connectivity:
   ```bash
   docker network inspect yukon-commerce-forge_yukon-network
   ```

## Production Considerations

1. **Change default credentials**: Update `POSTGRES_PASSWORD` in production
2. **Enable SSL**: Configure PostgreSQL SSL connections
3. **Backup strategy**: Set up regular database backups
4. **Monitoring**: Implement database monitoring and alerting
5. **Performance tuning**: Adjust PostgreSQL configuration for production workload
6. **Supabase integration**: If using Supabase, remove local auth setup and use Supabase's managed auth

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker PostgreSQL Image](https://hub.docker.com/_/postgres)
- [Supabase Documentation](https://supabase.com/docs)

