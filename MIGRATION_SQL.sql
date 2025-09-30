/*
   🚀 CAMPUS CONNECT - DATABASE MIGRATION
   
   Copy and paste this entire SQL block into your Supabase SQL Editor and run it.
   This will add all missing profile fields to make the profile section fully updatable.
   
   After running this SQL:
   1. Restart your server (Ctrl+C and run npm run dev again)
   2. All profile fields will be updatable
*/

DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'graduation_year') THEN
    ALTER TABLE profiles ADD COLUMN graduation_year integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'student_id') THEN
    ALTER TABLE profiles ADD COLUMN student_id text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_number') THEN
    ALTER TABLE profiles ADD COLUMN phone_number text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'linkedin_url') THEN
    ALTER TABLE profiles ADD COLUMN linkedin_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'portfolio_url') THEN
    ALTER TABLE profiles ADD COLUMN portfolio_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'interests') THEN
    ALTER TABLE profiles ADD COLUMN interests text[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gpa') THEN
    ALTER TABLE profiles ADD COLUMN gpa numeric(3,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'major') THEN
    ALTER TABLE profiles ADD COLUMN major text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'minor') THEN
    ALTER TABLE profiles ADD COLUMN minor text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'hometown') THEN
    ALTER TABLE profiles ADD COLUMN hometown text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_image_url') THEN
    ALTER TABLE profiles ADD COLUMN profile_image_url text;
  END IF;
  
  -- Add missing fields that the frontend expects
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'headline') THEN
    ALTER TABLE profiles ADD COLUMN headline text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
    ALTER TABLE profiles ADD COLUMN location text;
  END IF;
  
  -- Add constraints (only if they don't exist)
  BEGIN
    ALTER TABLE profiles ADD CONSTRAINT check_graduation_year 
      CHECK (graduation_year IS NULL OR (graduation_year >= 2020 AND graduation_year <= 2050));
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE profiles ADD CONSTRAINT check_gpa 
      CHECK (gpa IS NULL OR (gpa >= 0.0 AND gpa <= 4.0));
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  
  -- Create index if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_student_id') THEN
    CREATE INDEX idx_profiles_student_id ON profiles(student_id) WHERE student_id IS NOT NULL;
  END IF;
  
  RAISE NOTICE '✅ Migration completed successfully! All profile fields are now available.';
END $$;