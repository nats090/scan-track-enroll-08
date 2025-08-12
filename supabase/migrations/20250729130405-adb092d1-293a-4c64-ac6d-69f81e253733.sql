-- Add RFID column to students table
ALTER TABLE public.students 
ADD COLUMN rfid text;