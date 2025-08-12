-- Add the missing 'type' column to attendance_records table
ALTER TABLE public.attendance_records 
ADD COLUMN type text NOT NULL DEFAULT 'check-in';

-- Update the column to allow both check-in and check-out values
-- Add a check constraint to ensure only valid values
ALTER TABLE public.attendance_records 
ADD CONSTRAINT attendance_records_type_check 
CHECK (type IN ('check-in', 'check-out'));