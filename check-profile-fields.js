// Database field checker - Run this to check if all profile fields exist
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const checkProfileFields = async () => {
  try {
    console.log('🔍 Checking profile table structure...')
    
    // Get the first profile to check available fields
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Error:', error.message)
      return
    }

    if (data && data.length > 0) {
      const profile = data[0]
      const availableFields = Object.keys(profile)
      
      console.log('✅ Available fields in profiles table:')
      availableFields.forEach(field => {
        console.log(`   - ${field}`)
      })
      
      // Check for the new fields we added
      const requiredFields = [
        'headline', 'location', 'hometown', 'phone_number', 
        'linkedin_url', 'portfolio_url', 'graduation_year', 
        'student_id', 'gpa', 'minor'
      ]
      
      const missingFields = requiredFields.filter(field => !availableFields.includes(field))
      
      if (missingFields.length === 0) {
        console.log('✅ All required fields are present!')
      } else {
        console.log('❌ Missing fields (need to run migration):')
        missingFields.forEach(field => {
          console.log(`   - ${field}`)
        })
        console.log('\n📝 Please run the MIGRATION_SQL.sql in your Supabase SQL Editor')
      }
      
    } else {
      console.log('⚠️  No profiles found in the database')
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message)
  }
}

checkProfileFields()