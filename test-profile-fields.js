// Test script to verify all profile fields are working correctly
require('dotenv').config();
const supabase = require('./config/supabase');

async function testProfileFields() {
  console.log('🧪 Testing Profile Fields Integration...\n');

  try {
    // Test 1: Check table structure
    console.log('1️⃣ Testing table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Table access error:', tableError.message);
      return;
    }

    console.log('✅ Table accessible');

    // Test 2: Check available columns by trying to select all fields
    console.log('\n2️⃣ Testing available fields...');
    const testFields = [
      'id', 'user_id', 'name', 'email', 'role',
      'department', 'major', 'minor', 'year', 'graduation_year', 'student_id',
      'bio', 'headline', 'location', 'hometown', 'gpa',
      'avatar_url', 'profile_image_url',
      'phone', 'phone_number',
      'github_url', 'linkedin_url', 'portfolio_url',
      'skills', 'interests', 'achievements',
      'is_verified', 'is_active', 'created_at', 'updated_at'
    ];

    const fieldResults = {};
    
    for (const field of testFields) {
      try {
        const { error } = await supabase
          .from('profiles')
          .select(field)
          .limit(1);
        
        fieldResults[field] = error ? '❌' : '✅';
      } catch (e) {
        fieldResults[field] = '❌';
      }
    }

    console.log('\n📊 Field availability:');
    Object.entries(fieldResults).forEach(([field, status]) => {
      console.log(`   ${status} ${field}`);
    });

    // Test 3: Count missing fields
    const missingFields = Object.entries(fieldResults)
      .filter(([, status]) => status === '❌')
      .map(([field]) => field);

    if (missingFields.length > 0) {
      console.log('\n⚠️  Missing fields detected:', missingFields.join(', '));
      console.log('   These fields may need to be added to the database schema.');
    } else {
      console.log('\n✅ All expected fields are available in the database!');
    }

    // Test 4: Test JSON field structure
    console.log('\n3️⃣ Testing JSON fields (skills, interests, achievements)...');
    
    const { data: jsonTest, error: jsonError } = await supabase
      .from('profiles')
      .select('skills, interests, achievements')
      .limit(1);

    if (!jsonError && jsonTest?.length > 0) {
      const profile = jsonTest[0];
      console.log('✅ JSON fields structure:');
      console.log('   skills:', typeof profile.skills, Array.isArray(profile.skills) ? `(array of ${profile.skills.length})` : '');
      console.log('   interests:', typeof profile.interests, Array.isArray(profile.interests) ? `(array of ${profile.interests.length})` : '');
      console.log('   achievements:', typeof profile.achievements, Array.isArray(profile.achievements) ? `(array of ${profile.achievements.length})` : '');
    }

    console.log('\n🎉 Profile fields test completed!');
    console.log('\n📋 Summary:');
    console.log(`   • Total fields tested: ${testFields.length}`);
    console.log(`   • Available fields: ${Object.values(fieldResults).filter(s => s === '✅').length}`);
    console.log(`   • Missing fields: ${missingFields.length}`);
    
    if (missingFields.length === 0) {
      console.log('\n✅ All profile fields are ready for LinkedIn-style editing!');
    } else {
      console.log('\n⚠️  Some fields need to be added to complete LinkedIn-style functionality.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testProfileFields().then(() => {
  console.log('\nTest completed. Exiting...');
  process.exit(0);
}).catch((error) => {
  console.error('Test error:', error);
  process.exit(1);
});