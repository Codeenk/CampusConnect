const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function runMigration() {
  console.log('🔧 Running database migration to add missing profile columns...');

  try {
    // Complete migration SQL with all missing fields
    const migrationSQL = `
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
        
        -- Add constraints
        IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_graduation_year') THEN
          ALTER TABLE profiles ADD CONSTRAINT check_graduation_year 
            CHECK (graduation_year IS NULL OR (graduation_year >= 2020 AND graduation_year <= 2050));
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'check_gpa') THEN
          ALTER TABLE profiles ADD CONSTRAINT check_gpa 
            CHECK (gpa IS NULL OR (gpa >= 0.0 AND gpa <= 4.0));
        END IF;
        
        RAISE NOTICE 'Migration completed successfully!';
      END $$;
    `;

    console.log('📋 EXECUTE THIS SQL IN YOUR SUPABASE SQL EDITOR:');
    console.log('==========================================');
    console.log(migrationSQL);
    console.log('==========================================');
    
    console.log('\n✅ After running the SQL:');
    console.log('1. Restart your server to clear schema cache');
    console.log('2. All profile fields will be updatable');

  } catch (error) {
    console.error('Migration preparation failed:', error);
  }
}

runMigration().catch(console.error);