CREATE POLICY "settings_authenticated_all"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'settings')
WITH CHECK (bucket_id = 'settings');
