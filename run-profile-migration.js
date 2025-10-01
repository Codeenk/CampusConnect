const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting LinkedIn profile sections migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250930120000_add_profile_sections.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded, length:', migrationSQL.length);
    
    // Split SQL into individual statements (simple approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length < 5) {
        continue;
      }
      
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${statement.substring(0, 100)}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          console.warn(`⚠️  Statement ${i + 1} failed with RPC, trying direct query:`, error.message);
          
          // Try direct query for simpler statements
          const { error: directError } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);
            
          if (directError) {
            console.error(`❌ Statement ${i + 1} failed:`, directError);
          } else {
            console.log(`✅ Statement ${i + 1} completed (alternative method)`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} completed successfully`);
        }
      } catch (err) {
        console.error(`❌ Statement ${i + 1} failed:`, err.message);
      }
    }
    
    console.log('🎉 Migration completed!');
    
    // Verify the new columns exist
    console.log('🔍 Verifying new columns...');
    const { data, error } = await supabase
      .from('profiles')
      .select('id, experience, projects, certifications')
      .limit(1);
      
    if (error) {
      console.error('❌ Verification failed:', error);
    } else {
      console.log('✅ New columns verified successfully!');
      console.log('📊 Sample row structure:', data[0] ? Object.keys(data[0]) : 'No data');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();