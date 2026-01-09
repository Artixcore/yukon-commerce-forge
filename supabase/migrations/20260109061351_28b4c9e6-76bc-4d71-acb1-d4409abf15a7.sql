-- Create landing_pages table
CREATE TABLE public.landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  
  -- Hero Section
  hero_image_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_cta_text TEXT DEFAULT 'অর্ডার করুন',
  hero_stats_text TEXT,
  
  -- SEO & Meta
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  
  -- Facebook/Meta Settings
  fb_pixel_id TEXT,
  fb_access_token TEXT,
  fb_test_event_code TEXT,
  fb_dataset_id TEXT,
  
  -- Features Section (JSONB array of strings)
  features JSONB DEFAULT '[]'::jsonb,
  
  -- Settings
  delivery_charge_inside NUMERIC DEFAULT 60,
  delivery_charge_outside NUMERIC DEFAULT 120,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create landing_page_products table
CREATE TABLE public.landing_page_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  custom_price NUMERIC,
  custom_original_price NUMERIC,
  custom_name TEXT,
  custom_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create landing_page_reviews table
CREATE TABLE public.landing_page_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  review_text TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create landing_page_orders table
CREATE TABLE public.landing_page_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID REFERENCES public.landing_pages(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  delivery_location TEXT DEFAULT 'inside_dhaka',
  total_amount NUMERIC NOT NULL,
  delivery_charge NUMERIC DEFAULT 60,
  status TEXT DEFAULT 'pending',
  items JSONB NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for landing_pages
CREATE POLICY "Anyone can view active landing pages"
ON public.landing_pages FOR SELECT
USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage landing pages"
ON public.landing_pages FOR ALL
USING (is_admin());

-- RLS Policies for landing_page_products
CREATE POLICY "Anyone can view landing page products"
ON public.landing_page_products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.landing_pages lp 
    WHERE lp.id = landing_page_id 
    AND (lp.is_active = true OR is_admin())
  )
);

CREATE POLICY "Admins can manage landing page products"
ON public.landing_page_products FOR ALL
USING (is_admin());

-- RLS Policies for landing_page_reviews
CREATE POLICY "Anyone can view landing page reviews"
ON public.landing_page_reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.landing_pages lp 
    WHERE lp.id = landing_page_id 
    AND (lp.is_active = true OR is_admin())
  )
);

CREATE POLICY "Admins can manage landing page reviews"
ON public.landing_page_reviews FOR ALL
USING (is_admin());

-- RLS Policies for landing_page_orders
CREATE POLICY "Anyone can create landing page orders"
ON public.landing_page_orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all landing page orders"
ON public.landing_page_orders FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update landing page orders"
ON public.landing_page_orders FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete landing page orders"
ON public.landing_page_orders FOR DELETE
USING (is_admin());

-- Create indexes for performance
CREATE INDEX idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX idx_landing_pages_active ON public.landing_pages(is_active);
CREATE INDEX idx_landing_page_products_page ON public.landing_page_products(landing_page_id);
CREATE INDEX idx_landing_page_reviews_page ON public.landing_page_reviews(landing_page_id);
CREATE INDEX idx_landing_page_orders_page ON public.landing_page_orders(landing_page_id);
CREATE INDEX idx_landing_page_orders_status ON public.landing_page_orders(status);

-- Create trigger for updated_at
CREATE TRIGGER update_landing_pages_updated_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_landing_page_orders_updated_at
BEFORE UPDATE ON public.landing_page_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();