/**
 * Script to create story-audio storage bucket
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function createAudioBucket() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    console.log('📦 Creating story-audio bucket...');

    const { data, error } = await supabase.storage.createBucket('story-audio', {
      public: true,
      fileSizeLimit: 104857600, // 100MB
      allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav'],
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ story-audio bucket already exists');
      } else {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
    } else {
      console.log('✅ story-audio bucket created successfully!');
      console.log('   Bucket ID:', data.id);
      console.log('   Public:', data.public);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

createAudioBucket();

