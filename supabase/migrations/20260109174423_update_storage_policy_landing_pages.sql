-- Update storage policy to allow uploads to landing-pages and categories folders
DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;

CREATE POLICY "Admins can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products-images' 
  AND (storage.foldername(name))[1] IN ('products', 'banners', 'categories', 'landing-pages')
  AND is_admin()
);
