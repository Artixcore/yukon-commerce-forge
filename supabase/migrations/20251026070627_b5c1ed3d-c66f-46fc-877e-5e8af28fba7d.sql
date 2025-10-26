-- Create order status enum
CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed', 
  'processing',
  'shipped',
  'delivered',
  'cancelled'
);

-- Add missing Bangladesh-specific columns to orders table
ALTER TABLE public.orders
  ADD COLUMN city text NOT NULL DEFAULT '',
  ADD COLUMN delivery_location text NOT NULL DEFAULT 'inside_dhaka',
  ADD COLUMN message text,
  ADD COLUMN delivery_charge numeric NOT NULL DEFAULT 60;

-- Make customer_email optional
ALTER TABLE public.orders
  ALTER COLUMN customer_email DROP NOT NULL;

-- Update existing status values to ensure they're valid
UPDATE public.orders SET status = 'pending' 
WHERE status NOT IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');

-- Drop the default on status column first
ALTER TABLE public.orders
  ALTER COLUMN status DROP DEFAULT;

-- Convert status column to use enum type
ALTER TABLE public.orders
  ALTER COLUMN status TYPE order_status USING status::order_status;

-- Set the new default using the enum type
ALTER TABLE public.orders
  ALTER COLUMN status SET DEFAULT 'pending'::order_status;

-- Add check constraint for delivery location
ALTER TABLE public.orders
  ADD CONSTRAINT delivery_location_check 
  CHECK (delivery_location IN ('inside_dhaka', 'outside_dhaka'));