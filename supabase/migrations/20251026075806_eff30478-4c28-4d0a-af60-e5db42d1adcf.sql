-- Create hero_banners table for carousel system
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

-- Enable RLS
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active banners"
  ON public.hero_banners FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage banners"
  ON public.hero_banners FOR ALL
  USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_hero_banners_updated_at
  BEFORE UPDATE ON public.hero_banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();