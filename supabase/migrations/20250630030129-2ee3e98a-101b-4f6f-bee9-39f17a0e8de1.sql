
-- Add the missing education_level column to the document_links table
ALTER TABLE public.document_links 
ADD COLUMN education_level TEXT NOT NULL DEFAULT 'senior_high' 
CHECK (education_level IN ('senior_high', 'college'));

-- Create an index on education_level for better performance when filtering
CREATE INDEX idx_document_links_education_level ON public.document_links(education_level);

-- Add uploaded_at column for better tracking (since it's used in the interface)
ALTER TABLE public.document_links 
ADD COLUMN uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now();
