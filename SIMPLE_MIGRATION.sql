-- Simple migration to add LinkedIn-style columns to profiles table
-- Execute this in your Supabase SQL editor

-- Add the new columns if they don't exist
DO $$
BEGIN
  -- Add experience column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'experience') THEN
    ALTER TABLE public.profiles ADD COLUMN experience jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added experience column';
  END IF;

  -- Add projects column  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'projects') THEN
    ALTER TABLE public.profiles ADD COLUMN projects jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added projects column';
  END IF;

  -- Add certifications column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'certifications') THEN
    ALTER TABLE public.profiles ADD COLUMN certifications jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added certifications column';
  END IF;

  -- Add education column for future use
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'education') THEN
    ALTER TABLE public.profiles ADD COLUMN education jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added education column';
  END IF;
END
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_experience_gin ON public.profiles USING gin (experience);
CREATE INDEX IF NOT EXISTS idx_profiles_projects_gin ON public.profiles USING gin (projects);
CREATE INDEX IF NOT EXISTS idx_profiles_certifications_gin ON public.profiles USING gin (certifications);

-- Add comments
COMMENT ON COLUMN public.profiles.experience IS 'JSONB array containing work experience entries';
COMMENT ON COLUMN public.profiles.projects IS 'JSONB array containing project entries';
COMMENT ON COLUMN public.profiles.certifications IS 'JSONB array containing certification entries';
COMMENT ON COLUMN public.profiles.education IS 'JSONB array containing education entries';

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('experience', 'projects', 'certifications', 'education')
ORDER BY column_name;