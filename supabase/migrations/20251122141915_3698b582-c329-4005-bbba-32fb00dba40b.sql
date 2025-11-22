-- Add hierarchical category support
-- Add parent_id to support category hierarchy
ALTER TABLE public.categories
ADD COLUMN parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;

-- Add level to track hierarchy depth (0 = root, 1 = subcategory, etc.)
ALTER TABLE public.categories
ADD COLUMN level INTEGER NOT NULL DEFAULT 0;

-- Add index for performance on parent_id queries
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- Add index for level-based queries
CREATE INDEX idx_categories_level ON public.categories(level);

-- Add constraint to prevent deep nesting (max 3 levels: 0, 1, 2)
ALTER TABLE public.categories
ADD CONSTRAINT check_category_level CHECK (level >= 0 AND level <= 2);

-- Function to update level when parent changes
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

-- Trigger to auto-update level on insert/update
CREATE TRIGGER set_category_level
  BEFORE INSERT OR UPDATE OF parent_id ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_category_level();