-- Drop existing INSERT policy for products-images bucket
DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;

-- Create new INSERT policy with all required folders
CREATE POLICY "Admins can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products-images'
  AND (storage.foldername(name))[1] = ANY (ARRAY['products', 'banners', 'categories', 'landing-pages'])
  AND is_admin()
);