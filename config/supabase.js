const { createClient } = require('@supabase/supabase-js');

// Ensure environment variables are loaded
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for backend operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection
const testConnection = async () => {
  try {
    // Test basic connectivity by attempting to select from our profiles table
    const { data, error } = await supabase
      .from('profiles') 
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "public.profiles" does not exist')) {
        console.log('✅ Supabase connected successfully');
        console.log('📋 Profiles table not found - please run the database migration');
        console.log('   Copy supabase/migrations/20250126120000_scalable_schema.sql');
        console.log('   and run it in your Supabase SQL Editor');
      } else if (error.message.includes('permission denied') || error.message.includes('RLS')) {
        console.log('✅ Supabase connected successfully');
        console.log('🔒 Tables exist but RLS policies active (this is expected)');
      } else {
        console.warn('⚠️  Supabase connection issue:', error.message);
        console.log('🔧 Please check your SUPABASE_URL and SUPABASE_SERVICE_KEY');
      }
    } else {
      console.log('✅ Supabase connected successfully');
      console.log('📊 Database tables are ready and accessible');
    }
  } catch (error) {
    console.warn('⚠️  Supabase connection error:', error.message);
    console.log('🔧 Please verify your Supabase configuration in .env');
  }
};

// Test connection on startup
testConnection();

module.exports = supabase;