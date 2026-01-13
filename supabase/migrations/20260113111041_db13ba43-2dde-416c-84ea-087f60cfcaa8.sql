-- Make city and message columns nullable (to preserve existing data)
ALTER TABLE orders ALTER COLUMN city DROP NOT NULL;
ALTER TABLE landing_page_orders ALTER COLUMN city DROP NOT NULL;