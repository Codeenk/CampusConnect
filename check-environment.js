#!/usr/bin/env node

/**
 * Environment and System Check
 * Tests all critical components before starting the server
 */

const dotenv = require('dotenv');
const path = require('path');

console.log('🔧 Running CampusConnect Environment Check...\n');

// 1. Load environment variables
dotenv.config();

// 2. Check critical environment variables
const requiredEnvVars = {
  'JWT_SECRET': process.env.JWT_SECRET,
  'SUPABASE_URL': process.env.SUPABASE_URL,
  'SUPABASE_SERVICE_KEY': process.env.SUPABASE_SERVICE_KEY,
  'PORT': process.env.PORT || '3001',
  'NODE_ENV': process.env.NODE_ENV || 'development'
};

console.log('📋 Environment Variables Check:');
let envErrors = [];

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (value) {
    const displayValue = key.includes('SECRET') || key.includes('KEY') 
      ? `${value.substring(0, 8)}...` 
      : value;
    console.log(`✅ ${key}: ${displayValue}`);
  } else {
    console.log(`❌ ${key}: MISSING`);
    envErrors.push(key);
  }
}

if (envErrors.length > 0) {
  console.log('\n🚨 Environment Error:');
  console.log(`Missing required variables: ${envErrors.join(', ')}`);
  console.log('Please check your .env file');
  process.exit(1);
}

// 3. Test Supabase connection
console.log('\n🔌 Testing Supabase Connection...');
try {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  
  console.log('✅ Supabase client created successfully');
  
  // Test a simple query
  supabase
    .from('profiles')
    .select('count', { count: 'exact', head: true })
    .then(({ count, error }) => {
      if (error) {
        console.log('❌ Supabase query test failed:', error.message);
      } else {
        console.log(`✅ Supabase connection active (${count || 0} profiles)`);
      }
    })
    .catch(err => {
      console.log('❌ Supabase connection failed:', err.message);
    });
    
} catch (error) {
  console.log('❌ Supabase setup failed:', error.message);
}

// 4. Check required modules
console.log('\n📦 Module Check:');
const requiredModules = [
  'express',
  'cors', 
  'ws',
  'jsonwebtoken',
  '@supabase/supabase-js'
];

for (const module of requiredModules) {
  try {
    require(module);
    console.log(`✅ ${module}: Available`);
  } catch (error) {
    console.log(`❌ ${module}: Missing - Run: npm install ${module}`);
  }
}

// 5. File structure check
console.log('\n📁 File Structure Check:');
const requiredFiles = [
  'server.js',
  'config/supabase.js',
  'websocket/messageServer.js',
  'routes/messagesOptimized.js',
  'src/services/optimizedMessaging.js',
  'src/contexts/MessagesContext.jsx'
];

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  try {
    require('fs').accessSync(filePath);
    console.log(`✅ ${file}: Found`);
  } catch (error) {
    console.log(`❌ ${file}: Missing`);
  }
}

console.log('\n🎯 Environment Check Complete!');
console.log('If all checks passed, you can now start the server safely.\n');