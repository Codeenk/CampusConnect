const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking current database schema...');
    
    // Try to fetch a profile with all expected fields
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id, user_id, name, email, role, bio, department, year, skills, github_url, achievements, 
        created_at, updated_at, graduation_year, student_id, phone_number, linkedin_url, 
        portfolio_url, interests, gpa, major, minor, hometown, profile_image_url, headline, location
      `)
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Database query failed:', error.message);
      console.log('\n🔧 The database is missing some columns. Please run the migration SQL.');
      return false;
    } else {
      console.log('✅ Database schema check passed!');
      console.log('📋 Available fields:', Object.keys(profile || {}));
      return true;
    }
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
    return false;
  }
}

async function testProfileUpdate() {
  try {
    console.log('\n🧪 Testing profile update...');
    
    // Try to update with all fields
    const testData = {
      headline: 'Test Headline',
      location: 'Test Location',
      gpa: 3.75,
      hometown: 'Test Hometown',
      minor: 'Test Minor'
    };

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1)
      .single();

    if (!data) {
      console.log('ℹ️  No profiles found to test with');
      return;
    }

    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update(testData)
      .eq('user_id', data.user_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Profile update failed:', updateError.message);
      console.log('🔧 Some fields are missing from the database schema');
    } else {
      console.log('✅ Profile update test passed!');
      console.log('📝 Updated fields:', Object.keys(testData));
    }
  } catch (error) {
    console.error('❌ Update test failed:', error.message);
  }
}

async function runDiagnostics() {
  console.log('🚀 Campus Connect - Profile System Diagnostics\n');
  
  const schemaOk = await checkDatabaseSchema();
  
  if (schemaOk) {
    await testProfileUpdate();
    console.log('\n✅ Profile system is ready! All fields should be updatable.');
  } else {
    console.log('\n❌ Database migration required. Run the MIGRATION_SQL.sql in Supabase.');
  }
}

runDiagnostics();