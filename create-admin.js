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

async function createAdminUser() {
  console.log('🚀 Creating admin user...');
  
  const email = 'admin@gmail.com';
  const password = 'admin@123';
  
  try {
    // 1. Create auth user
    console.log('📝 Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: 'TPC Admin',
        role: 'admin'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User already exists, updating profile...');
        
        // Get existing user
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === email);
        
        if (existingUser) {
          // Update profile to admin role
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              role: 'admin',
              name: 'TPC Admin'
            })
            .eq('user_id', existingUser.id);
          
          if (updateError) {
            console.error('❌ Error updating profile:', updateError);
          } else {
            console.log('✅ Admin user profile updated successfully!');
            console.log('\n📧 Login Credentials:');
            console.log('   Email:', email);
            console.log('   Password:', password);
          }
        }
        return;
      }
      throw authError;
    }

    console.log('✅ Auth user created:', authData.user.email);

    // 2. Create/Update profile with admin role
    console.log('📝 Creating admin profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: authData.user.id,
        email: email,
        name: 'TPC Admin',
        role: 'admin',
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      throw profileError;
    }

    console.log('✅ Admin profile created successfully!');
    console.log('\n🎉 Admin user setup complete!');
    console.log('\n📧 Login Credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('\n🔐 You can now login to the TPC Portal with these credentials.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();
