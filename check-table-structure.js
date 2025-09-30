require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkTableStructure() {
  try {
    console.log('Checking profile table structure...');
    
    // Get one profile to see the column structure
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    
    if (profiles && profiles[0]) {
      console.log('Profile table columns:');
      console.log(Object.keys(profiles[0]));
      console.log('\nSample profile data:');
      const profile = profiles[0];
      Object.keys(profile).forEach(key => {
        console.log(`${key}:`, typeof profile[key], profile[key] ? (Array.isArray(profile[key]) ? `[Array of ${profile[key].length}]` : `"${String(profile[key]).substring(0, 50)}..."`) : 'null');
      });
    } else {
      console.log('No profiles found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTableStructure();