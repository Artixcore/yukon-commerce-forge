-- Add variant support columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS size_chart JSONB DEFAULT '[]';

COMMENT ON COLUMN products.colors IS 'Array of color objects with name and hex: [{"name": "Green", "hex": "#22c55e"}]';
COMMENT ON COLUMN products.sizes IS 'Array of available sizes: ["S", "M", "L", "XL"]';
COMMENT ON COLUMN products.size_chart IS 'Array of size measurements: [{"size": "S", "length": "26", "chest": "40", "sleeve": "6.5"}]';

-- Add variant info to order_items table
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS product_color TEXT,
ADD COLUMN IF NOT EXISTS product_size TEXT;

COMMENT ON COLUMN order_items.product_color IS 'Selected color variant for this order item';
COMMENT ON COLUMN order_items.product_size IS 'Selected size variant for this order item';