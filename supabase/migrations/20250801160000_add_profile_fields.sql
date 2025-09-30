-- Add missing fields to profiles table for comprehensive profile management

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS graduation_year integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gpa numeric(3,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS major text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS minor text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hometown text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image_url text;

-- Add constraints for data validation
ALTER TABLE profiles ADD CONSTRAINT check_graduation_year 
  CHECK (graduation_year IS NULL OR (graduation_year >= 2020 AND graduation_year <= 2050));

ALTER TABLE profiles ADD CONSTRAINT check_gpa 
  CHECK (gpa IS NULL OR (gpa >= 0.0 AND gpa <= 4.0));

-- Add index for student_id if it exists
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id) WHERE student_id IS NOT NULL;

-- Comment explaining the additional fields
COMMENT ON TABLE profiles IS 'User profile information with comprehensive fields for students, faculty, and admin users';
COMMENT ON COLUMN profiles.graduation_year IS 'Expected or actual graduation year for students';
COMMENT ON COLUMN profiles.student_id IS 'University student identification number';
COMMENT ON COLUMN profiles.phone_number IS 'Contact phone number';
COMMENT ON COLUMN profiles.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN profiles.portfolio_url IS 'Personal portfolio/website URL';
COMMENT ON COLUMN profiles.interests IS 'Array of personal interests and hobbies';
COMMENT ON COLUMN profiles.gpa IS 'Grade Point Average (0.0 to 4.0 scale)';
COMMENT ON COLUMN profiles.major IS 'Primary field of study/major';
COMMENT ON COLUMN profiles.minor IS 'Secondary field of study/minor';
COMMENT ON COLUMN profiles.hometown IS 'Hometown or place of origin';
COMMENT ON COLUMN profiles.profile_image_url IS 'URL to profile picture/avatar';