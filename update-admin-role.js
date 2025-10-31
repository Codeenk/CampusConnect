import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateToAdmin() {
  const email = 'admin@gmail.com';
  
  console.log('🔍 Finding user:', email);
  
  try {
    // Get user ID from auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) throw listError;
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.log('❌ User not found. Please create the user first in Supabase dashboard.');
      console.log('\n📝 Steps to create user:');
      console.log('1. Go to Supabase Dashboard → Authentication → Users');
      console.log('2. Click "Add User"');
      console.log('3. Email: admin@gmail.com');
      console.log('4. Password: admin@123');
      console.log('5. Enable "Auto Confirm User"');
      process.exit(1);
    }
    
    console.log('✅ Found user:', user.id);
    console.log('📝 Updating profile to admin role...');
    
    // Update profile role
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: 'admin',
        name: 'TPC Admin'
      })
      .eq('user_id', user.id)
      .select();
    
    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      throw updateError;
    }
    
    console.log('✅ Profile updated successfully!');
    console.log('\n🎉 Admin user is ready!');
    console.log('\n📧 Login Credentials for TPC Portal:');
    console.log('   Email:', email);
    console.log('   Password: admin@123');
    console.log('\n🌐 TPC Portal URL: http://localhost:3002');
    console.log('💻 Make sure the backend server is running on port 3001');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateToAdmin();
