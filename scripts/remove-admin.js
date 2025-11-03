/**
 * Script to remove admin privileges from a user
 * Usage: node scripts/remove-admin.js <email>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

const userEmail = process.argv[2];

if (!userEmail) {
  console.error('❌ Please provide an email address');
  console.error('Usage: node scripts/remove-admin.js <email>');
  process.exit(1);
}

async function removeAdmin() {
  console.log(`🔒 Removing admin privileges from ${userEmail}...\n`);
  
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    const { data, error } = await supabase
      .from('users')
      .update({
        is_admin: false,
      })
      .eq('email', userEmail)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.error(`❌ User with email ${userEmail} not found`);
      } else {
        console.error('❌ Error:', error.message);
      }
      process.exit(1);
    }
    
    console.log('✅ Admin privileges removed!');
    console.log(`   Email: ${userEmail}`);
    console.log(`   Admin: No`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

removeAdmin();

