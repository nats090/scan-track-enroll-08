-- Add missing columns to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS biometric_data TEXT;

-- Add missing column to document_links table  
ALTER TABLE public.document_links
ADD COLUMN IF NOT EXISTS education_level TEXT DEFAULT 'general';