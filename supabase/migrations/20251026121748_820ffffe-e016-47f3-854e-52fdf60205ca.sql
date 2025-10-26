-- Create gallery_images table
CREATE TABLE public.gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Create policies for gallery_images
CREATE POLICY "Anyone can view active gallery images" 
ON public.gallery_images 
FOR SELECT 
USING ((is_active = true) OR is_admin());

CREATE POLICY "Admins can manage gallery images" 
ON public.gallery_images 
FOR ALL 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_gallery_images_updated_at
BEFORE UPDATE ON public.gallery_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();