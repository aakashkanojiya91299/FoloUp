-- Storage Bucket Setup for Applications Feature
-- Run this in your Supabase SQL Editor

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'resumes', 
    'resumes', 
    false, 
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload resumes to their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can view resumes from their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can update resumes from their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete resumes from their organization" ON storage.objects;

-- Create DEBUG storage policies for resumes bucket (more permissive for testing)
CREATE POLICY "Users can upload resumes to their organization" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Users can view resumes from their organization" ON storage.objects
    FOR SELECT USING (bucket_id = 'resumes');

CREATE POLICY "Users can update resumes from their organization" ON storage.objects
    FOR UPDATE USING (bucket_id = 'resumes');

CREATE POLICY "Users can delete resumes from their organization" ON storage.objects
    FOR DELETE USING (bucket_id = 'resumes');

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'resumes'; 
