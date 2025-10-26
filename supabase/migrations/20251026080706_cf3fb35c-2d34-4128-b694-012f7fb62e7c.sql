-- Create products-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('products-images', 'products-images', true);

-- Allow anyone to read images (public bucket)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products-images');

-- Allow admins to upload images
CREATE POLICY "Admins can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products-images' 
  AND (storage.foldername(name))[1] IN ('products', 'banners')
  AND is_admin()
);

-- Allow admins to update images
CREATE POLICY "Admins can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products-images' 
  AND is_admin()
);

-- Allow admins to delete images
CREATE POLICY "Admins can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'products-images' 
  AND is_admin()
);