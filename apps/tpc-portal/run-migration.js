import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  console.error('Required variables:');
  console.error('- SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_KEY');
  console.error('Available variables:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running TPC Portal database migration...');
  
  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../../supabase/migrations/20241008000000_tpc_portal_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} migration statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;
      
      console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql: statement + ';' 
      });
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error);
        // Continue with other statements unless it's a critical error
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('   ⚠️  Object already exists, continuing...');
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ TPC Portal migration completed successfully!');
    
    // Verify tables were created
    console.log('\n🔍 Verifying TPC tables...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['tpc_export_jobs', 'tpc_export_artifacts']);
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else {
      console.log('📋 Created tables:', tables.map(t => t.table_name).join(', '));
    }
    
    // Check if tpc_admin role was added
    const { data: enumValues, error: enumError } = await supabase.rpc('exec_sql', {
      sql: "SELECT unnest(enum_range(NULL::user_role)) as role_value"
    });
    
    if (!enumError && enumValues) {
      const roles = enumValues.map(row => row.role_value);
      console.log('👥 Available user roles:', roles.join(', '));
      
      if (roles.includes('tpc_admin')) {
        console.log('✅ tpc_admin role is available');
      } else {
        console.log('⚠️  tpc_admin role not found in enum');
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();