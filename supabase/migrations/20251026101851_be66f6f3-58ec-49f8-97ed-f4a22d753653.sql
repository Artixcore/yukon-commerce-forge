-- Add new fields to products table for ratings and discounts
ALTER TABLE public.products
ADD COLUMN rating numeric(3,2),
ADD COLUMN review_count integer DEFAULT 0 NOT NULL,
ADD COLUMN original_price numeric,
ADD COLUMN discount_percentage integer;

-- Add check constraint for discount percentage
ALTER TABLE public.products
ADD CONSTRAINT valid_discount_percentage CHECK (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 100));

-- Add check constraint for rating
ALTER TABLE public.products
ADD CONSTRAINT valid_rating CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));

-- Create reviews table
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  is_approved boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Anyone can insert reviews"
ON public.reviews
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can view approved reviews"
ON public.reviews
FOR SELECT
TO public
USING (is_approved = true OR is_admin());

CREATE POLICY "Admins can update all reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (is_admin());

-- Create trigger to update product rating when review is approved
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

CREATE TRIGGER on_review_changed
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_rating();

-- Create trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();