-- Add missing columns to profiles table for LinkedIn-style profile
-- Run this in your Supabase SQL Editor

-- Add headline field (professional title/description)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS headline text DEFAULT '';

-- Add location field
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location text DEFAULT '';

-- Add social media URLs
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS linkedin_url text DEFAULT '';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS portfolio_url text DEFAULT '';

-- Add structured experience data (JSON array)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS experience jsonb DEFAULT '[]'::jsonb;

-- Add structured projects data (JSON array)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS projects jsonb DEFAULT '[]'::jsonb;

-- Add open to work status
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS open_to_work boolean DEFAULT false;

-- Update existing records to have empty arrays for new JSON fields
UPDATE public.profiles 
SET 
    experience = '[]'::jsonb,
    projects = '[]'::jsonb
WHERE 
    experience IS NULL OR projects IS NULL;

-- Add constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT check_headline_length 
CHECK (char_length(headline) <= 200);

ALTER TABLE public.profiles 
ADD CONSTRAINT check_location_length 
CHECK (char_length(location) <= 100);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_open_to_work ON public.profiles(open_to_work);

-- Comments for documentation
COMMENT ON COLUMN public.profiles.headline IS 'Professional headline/title displayed below name';
COMMENT ON COLUMN public.profiles.location IS 'Current location (city, state/country)';
COMMENT ON COLUMN public.profiles.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN public.profiles.portfolio_url IS 'Personal portfolio/website URL';
COMMENT ON COLUMN public.profiles.experience IS 'JSON array of work experience entries';
COMMENT ON COLUMN public.profiles.projects IS 'JSON array of project entries';
COMMENT ON COLUMN public.profiles.open_to_work IS 'Whether the user is open to work opportunities';