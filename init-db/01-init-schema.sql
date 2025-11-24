-- Yukon Commerce Database Schema
-- Consolidated from all Supabase migrations
-- This script initializes the complete database schema

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TYPES
-- ============================================================================

-- App role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- Order status enum
CREATE TYPE public.order_status AS ENUM (
  'pending',
  'confirmed', 
  'processing',
  'shipped',
  'delivered',
  'cancelled'
);

-- ============================================================================
-- AUTH SCHEMA (Required for user_roles table)
-- ============================================================================

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create simplified users table (mimics Supabase auth.users)
-- This is a minimal version for local development
-- In production with Supabase, this table is managed by Supabase Auth
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  encrypted_password TEXT,
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_app_meta_data JSONB,
  raw_user_meta_data JSONB,
  is_super_admin BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'authenticated'
);

-- Create function to get current user ID (auth.uid())
-- This function returns the current user ID from the session
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('request.jwt.claim.sub', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to get current user role (auth.role())
CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('request.jwt.claim.role', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'anon';
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant necessary permissions for RLS to work
GRANT USAGE ON SCHEMA auth TO anon, authenticated, public;
GRANT SELECT ON auth.users TO anon, authenticated, public;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, public;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated, public;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Categories table with hierarchical support
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_category_level CHECK (level >= 0 AND level <= 2)
);

-- Products table with variants, ratings, and discounts
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price NUMERIC,
  discount_percentage INTEGER,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC(3,2),
  review_count INTEGER DEFAULT 0 NOT NULL,
  colors JSONB DEFAULT '[]',
  sizes JSONB DEFAULT '[]',
  size_chart JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_discount_percentage CHECK (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 100)),
  CONSTRAINT valid_rating CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5))
);

-- Orders table with Bangladesh-specific fields
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  shipping_address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  delivery_location TEXT NOT NULL DEFAULT 'inside_dhaka',
  message TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_charge NUMERIC NOT NULL DEFAULT 60,
  status public.order_status NOT NULL DEFAULT 'pending'::public.order_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT delivery_location_check CHECK (delivery_location IN ('inside_dhaka', 'outside_dhaka'))
);

-- Order items table with product variants
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_color TEXT,
  product_size TEXT,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (references auth.users which will be created in 02-setup-auth.sql)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Hero banners table for carousel system
CREATE TABLE public.hero_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  button_text TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_approved BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Gallery images table
CREATE TABLE public.gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Meta settings table (singleton pattern)
CREATE TABLE public.meta_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  pixel_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  test_event_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT singleton_check CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_level ON public.categories(level);
CREATE UNIQUE INDEX idx_meta_settings_singleton ON public.meta_settings (id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check admin status (will be updated in 02-setup-auth.sql)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
  );
END;
$$;

-- Function to update category level when parent changes
CREATE OR REPLACE FUNCTION public.update_category_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.level := 0;
  ELSE
    SELECT level + 1 INTO NEW.level
    FROM public.categories
    WHERE id = NEW.parent_id;
    
    -- Prevent going beyond max depth
    IF NEW.level > 2 THEN
      RAISE EXCEPTION 'Maximum category depth (3 levels) exceeded';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update product rating when review is approved
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET 
    rating = (
      SELECT AVG(rating)::numeric(3,2)
      FROM reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
        AND is_approved = true
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        AND is_approved = true
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Function to update product stock when order items are created
CREATE OR REPLACE FUNCTION public.update_product_stock_on_order()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at triggers
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hero_banners_updated_at
  BEFORE UPDATE ON public.hero_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gallery_images_updated_at
  BEFORE UPDATE ON public.gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meta_settings_updated_at
  BEFORE UPDATE ON public.meta_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Category level trigger
CREATE TRIGGER set_category_level
  BEFORE INSERT OR UPDATE OF parent_id ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_category_level();

-- Product rating trigger
CREATE TRIGGER on_review_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_rating();

-- Product stock update trigger
CREATE TRIGGER update_stock_after_order_item
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_stock_on_order();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_settings ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin());

-- Products policies
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.is_admin());

-- Orders policies
CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- Order items policies
CREATE POLICY "Anyone can create order items"
  ON public.order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (public.is_admin());

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin());

-- Hero banners policies
CREATE POLICY "Anyone can view active banners"
  ON public.hero_banners FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage banners"
  ON public.hero_banners FOR ALL
  USING (public.is_admin());

-- Reviews policies
CREATE POLICY "Anyone can insert reviews"
  ON public.reviews FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews FOR SELECT
  TO public
  USING (is_approved = true OR public.is_admin());

CREATE POLICY "Admins can update all reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Gallery images policies
CREATE POLICY "Anyone can view active gallery images" 
  ON public.gallery_images FOR SELECT 
  USING ((is_active = true) OR public.is_admin());

CREATE POLICY "Admins can manage gallery images" 
  ON public.gallery_images FOR ALL 
  USING (public.is_admin());

-- Meta settings policies
CREATE POLICY "Admins can view meta settings"
  ON public.meta_settings FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage meta settings"
  ON public.meta_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample categories
INSERT INTO public.categories (name, slug, description) VALUES
  ('Apparel', 'apparel', 'Clothing and fashion items'),
  ('Accessories', 'accessories', 'Fashion accessories and add-ons'),
  ('Lifestyle', 'lifestyle', 'Lifestyle products and essentials'),
  ('Outdoor', 'outdoor', 'Outdoor gear and equipment')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO public.products (name, slug, description, price, category_id, stock_quantity, is_featured, is_active) 
SELECT 
  'Classic Tee', 'classic-tee', 'Comfortable cotton t-shirt', 29.99, 
  (SELECT id FROM public.categories WHERE slug = 'apparel' LIMIT 1), 50, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'classic-tee')
UNION ALL
SELECT 
  'Denim Jacket', 'denim-jacket', 'Stylish denim jacket', 89.99,
  (SELECT id FROM public.categories WHERE slug = 'apparel' LIMIT 1), 30, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'denim-jacket')
UNION ALL
SELECT 
  'Leather Wallet', 'leather-wallet', 'Genuine leather wallet', 49.99,
  (SELECT id FROM public.categories WHERE slug = 'accessories' LIMIT 1), 100, false, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'leather-wallet')
UNION ALL
SELECT 
  'Backpack', 'backpack', 'Durable travel backpack', 79.99,
  (SELECT id FROM public.categories WHERE slug = 'outdoor' LIMIT 1), 45, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'backpack');

