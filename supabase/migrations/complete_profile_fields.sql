-- Complete Profile Schema Update - Ensure LinkedIn-style functionality
-- Run this migration to add any missing profile fields

-- Add missing fields to profiles table (using IF NOT EXISTS to avoid errors)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS headline text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hometown text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS minor text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gpa numeric(3,2) DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_image_url text DEFAULT '';

-- Ensure constraints are in place
DO $$ 
BEGIN
  -- Add GPA constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_gpa_range' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_gpa_range 
      CHECK (gpa IS NULL OR (gpa >= 0.0 AND gpa <= 4.0));
  END IF;

  -- Add graduation year constraint if it doesn't exist  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_graduation_year_range' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_graduation_year_range 
      CHECK (graduation_year IS NULL OR (graduation_year >= 2020 AND graduation_year <= 2050));
  END IF;

  -- Add headline length constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_headline_length' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_headline_length 
      CHECK (char_length(headline) <= 200);
  END IF;

  -- Add location length constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_location_length' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_location_length 
      CHECK (char_length(location) <= 100);
  END IF;

  -- Add hometown length constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_hometown_length' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT check_hometown_length 
      CHECK (char_length(hometown) <= 100);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_headline ON public.profiles(headline);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_graduation_year ON public.profiles(graduation_year);

-- Update updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_profiles_updated_at' 
    AND event_object_table = 'profiles'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at 
      BEFORE UPDATE ON public.profiles 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.headline IS 'Professional headline or tagline (max 200 chars)';
COMMENT ON COLUMN public.profiles.location IS 'Current location/city (max 100 chars)';
COMMENT ON COLUMN public.profiles.hometown IS 'Hometown or place of origin (max 100 chars)';
COMMENT ON COLUMN public.profiles.minor IS 'Academic minor or secondary specialization';
COMMENT ON COLUMN public.profiles.gpa IS 'Grade Point Average on 4.0 scale';
COMMENT ON COLUMN public.profiles.phone_number IS 'Contact phone number';
COMMENT ON COLUMN public.profiles.profile_image_url IS 'URL to profile picture/avatar image';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Profile schema update completed successfully!';
  RAISE NOTICE 'All LinkedIn-style profile fields are now available.';
END $$;