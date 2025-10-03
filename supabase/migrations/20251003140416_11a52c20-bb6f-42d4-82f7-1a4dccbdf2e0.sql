-- Make medical-documents bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'medical-documents';

-- Add RLS policies for medical documents storage
CREATE POLICY "Users can view their own medical documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload their own medical documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own medical documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'medical-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own medical documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create table to track upload rate limiting
CREATE TABLE IF NOT EXISTS public.upload_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_count integer DEFAULT 1,
  hour_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on upload_rate_limits
ALTER TABLE public.upload_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for upload_rate_limits
CREATE POLICY "Users can view their own rate limits"
ON public.upload_rate_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rate limits"
ON public.upload_rate_limits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rate limits"
ON public.upload_rate_limits
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create table to track AI request rate limiting
CREATE TABLE IF NOT EXISTS public.ai_request_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_count integer DEFAULT 1,
  hour_start timestamp with time zone NOT NULL DEFAULT now(),
  last_request timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on ai_request_limits
ALTER TABLE public.ai_request_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_request_limits
CREATE POLICY "Users can view their own AI rate limits"
ON public.ai_request_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI rate limits"
ON public.ai_request_limits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI rate limits"
ON public.ai_request_limits
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Add file hash column to medical_documents for duplicate detection
ALTER TABLE public.medical_documents
ADD COLUMN IF NOT EXISTS file_hash text,
ADD COLUMN IF NOT EXISTS file_size bigint;