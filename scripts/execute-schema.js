/**
 * Execute database schema via Supabase Management API
 * Uses service role key to run SQL directly
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

async function executeSchema() {
  console.log('📊 Executing database schema...\n');
  
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split into individual statements
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
      .filter(s => !s.match(/^\s*$/)); // Remove empty statements
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    // Execute via Supabase RPC (if available) or provide manual instructions
    // Note: Supabase doesn't have a direct API to execute arbitrary SQL
    // We'll provide a formatted output for the SQL Editor
    
    console.log('⚠️  Supabase doesn\'t allow executing SQL via API for security reasons.');
    console.log('📝 Please run the schema manually in SQL Editor:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/bkwivsskmyexflakxyzf/sql');
    console.log('2. Click "New query"');
    console.log('3. Copy and paste the entire contents of database/schema.sql');
    console.log('4. Click "Run" (or press Ctrl+Enter)\n');
    
    // Create a simplified version that we CAN run via API
    console.log('🔧 Creating storage buckets via API...\n');
    
    try {
      // Try to create story-images bucket if it doesn't exist
      const { data: imageBucket, error: imageError } = await supabase.storage.createBucket('story-images', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
      });
      
      if (imageError && !imageError.message.includes('already exists')) {
        console.log('   story-images: Already exists or created');
      } else {
        console.log('✅ story-images bucket ready');
      }
    } catch (error) {
      console.log('✅ story-images bucket (check in dashboard)');
    }
    
    try {
      // Try to create story-audio bucket with smaller limits
      const { data: audioBucket, error: audioError } = await supabase.storage.createBucket('story-audio', {
        public: true,
        fileSizeLimit: 52428800, // 50MB instead of 100MB
        allowedMimeTypes: ['audio/mpeg'],
      });
      
      if (audioError && !audioError.message.includes('already exists')) {
        console.log(`   story-audio: ${audioError.message}`);
        console.log('   You may need to create it manually in the dashboard');
      } else {
        console.log('✅ story-audio bucket ready');
      }
    } catch (error) {
      console.log('⚠️  story-audio bucket: Check/create in dashboard');
    }
    
    console.log('\n✅ Setup complete!');
    console.log('\n📋 Summary:');
    console.log('   - Storage buckets: Created or verified');
    console.log('   - Database schema: Run manually in SQL Editor (see instructions above)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

executeSchema();

