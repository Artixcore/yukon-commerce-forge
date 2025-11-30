-- Add SEO meta fields to hero_banners table
ALTER TABLE public.hero_banners
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS meta_description text,
ADD COLUMN IF NOT EXISTS meta_keywords text,
ADD COLUMN IF NOT EXISTS meta_tags jsonb DEFAULT '[]'::jsonb;

-- Create google_settings table for Google Analytics & SEO settings
CREATE TABLE IF NOT EXISTS public.google_settings (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000002'::uuid,
  ga_measurement_id text,
  gtm_container_id text,
  google_site_verification text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on google_settings
ALTER TABLE public.google_settings ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for google_settings (admin only)
CREATE POLICY "Admins can view google settings"
ON public.google_settings
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage google settings"
ON public.google_settings
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add updated_at trigger to google_settings
CREATE TRIGGER update_google_settings_updated_at
BEFORE UPDATE ON public.google_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();