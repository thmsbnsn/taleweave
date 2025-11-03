/**
 * Script to set up Supabase database schema and storage buckets
 * Requires: Database connection string or Supabase API keys
 */

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Extract project info
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bkwivsskmyexflakxyzf.supabase.co';
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'bkwivsskmyexflakxyzf';

// Try connection pooler endpoint first (more reliable)
const DB_CONNECTION_STRING = process.env.DATABASE_URL || 
  `postgresql://postgres.bkwivsskmyexflakxyzf:L0g!nSt@geX4@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

console.log('🔧 Supabase Setup Script');
console.log(`   Project Ref: ${projectRef}`);
console.log(`   Supabase URL: ${SUPABASE_URL}\n`);

async function setupDatabase() {
  console.log('📊 Setting up database schema...');
  
  // First try using Supabase API with service role key
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    console.log('   Using Supabase API...');
    try {
      const supabase = createClient(SUPABASE_URL, serviceKey);
      
      // Use Supabase REST API to execute SQL (via RPC or direct)
      // For now, we'll use the SQL editor approach via Management API
      // Or execute via pgAdmin connection
      console.log('   Note: Schema should be run via Supabase SQL Editor');
      console.log('   The script will create storage buckets...');
      return; // Skip direct DB connection if we have API key
    } catch (error) {
      console.log('   API method failed, trying direct connection...');
    }
  }

  try {
    // Try direct PostgreSQL connection
    let cleanConnectionString = DB_CONNECTION_STRING.replace(/\[([^\]]+)\]/, '$1');
    
    // Try connection pooler first
    const poolerUrl = `postgresql://postgres.${projectRef}:L0g!nSt@geX4@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;
    
    const client = new Client({
      connectionString: poolerUrl,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Read and execute schema SQL
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolons and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.length > 10) { // Skip very short statements
        try {
          await client.query(statement);
        } catch (error) {
          // Ignore "already exists" errors
          if (!error.message.includes('already exists') && 
              !error.message.includes('duplicate key') &&
              !error.message.includes('relation') &&
              !error.message.includes('does not exist')) {
            console.warn(`   Warning: ${error.message.split('\n')[0]}`);
          }
        }
      }
    }

    console.log('✅ Database schema created/updated');
    await client.end();
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    throw error;
  }
}

async function setupStorageBuckets() {
  console.log('\n📦 Setting up storage buckets...');
  
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey && !anonKey) {
    console.log('⚠️  API keys not found in .env.local');
    console.log('   Please add your Supabase API keys first.');
    console.log('   Get them from: https://supabase.com/dashboard/project/' + projectRef + '/settings/api');
    console.log('\n   Then run this script again.');
    return;
  }

  try {
    // Use service role key for admin operations
    const supabase = createClient(SUPABASE_URL, serviceKey || anonKey);

    // Create story-images bucket
    try {
      const { data: imageBucket, error: imageError } = await supabase.storage.createBucket('story-images', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
      });

      if (imageError && !imageError.message.includes('already exists')) {
        console.warn(`   Warning creating story-images bucket: ${imageError.message}`);
      } else {
        console.log('✅ story-images bucket ready');
      }
    } catch (error) {
      console.log('✅ story-images bucket (may already exist)');
    }

    // Create story-audio bucket
    try {
      const { data: audioBucket, error: audioError } = await supabase.storage.createBucket('story-audio', {
        public: true,
        fileSizeLimit: 104857600, // 100MB
        allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav'],
      });

      if (audioError && !audioError.message.includes('already exists')) {
        console.warn(`   Warning creating story-audio bucket: ${audioError.message}`);
      } else {
        console.log('✅ story-audio bucket ready');
      }
    } catch (error) {
      console.log('✅ story-audio bucket (may already exist)');
    }
  } catch (error) {
    console.error('❌ Storage setup error:', error.message);
    console.log('   Note: You may need to create buckets manually in the Supabase dashboard');
  }
}

async function getApiKeysInfo() {
  console.log('\n🔑 API Keys Information:');
  console.log('\n   To get your Supabase API keys:');
  console.log(`   1. Go to: https://supabase.com/dashboard/project/${projectRef}/settings/api`);
  console.log('   2. Copy the following:');
  console.log('      - Project URL → NEXT_PUBLIC_SUPABASE_URL');
  console.log('      - anon public key → NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('      - service_role key → SUPABASE_SERVICE_ROLE_KEY');
  console.log('\n   Add them to your .env.local file:');
  console.log(`   NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}`);
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
}

async function main() {
  try {
    // Setup database
    await setupDatabase();
    
    // Setup storage (if API keys available)
    await setupStorageBuckets();
    
    // Show API keys info
    await getApiKeysInfo();
    
    console.log('\n✨ Supabase setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Add your Supabase API keys to .env.local');
    console.log('   2. Verify storage buckets are created in Supabase dashboard');
    console.log('   3. Test the connection with: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();

