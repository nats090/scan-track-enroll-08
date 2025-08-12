-- Fix the missing library column support and triggers

-- First, add library column to students table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'library') THEN
        ALTER TABLE public.students ADD COLUMN library text DEFAULT 'notre-dame';
    END IF;
END $$;

-- Add library column to attendance_records table if not exists  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'attendance_records' AND column_name = 'library') THEN
        ALTER TABLE public.attendance_records ADD COLUMN library text DEFAULT 'notre-dame';
    END IF;
END $$;

-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Add missing triggers for updated_at on students table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                   WHERE trigger_name = 'update_students_updated_at') THEN
        CREATE TRIGGER update_students_updated_at
            BEFORE UPDATE ON public.students
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;