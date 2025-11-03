/**
 * Quick script to set admin for your email
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = 'thmsbnsn@bnsnsolutions.com';

async function setAdmin() {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    // First, ensure the user exists - try to find by email
    const { data: existingUsers, error: listError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', ADMIN_EMAIL)
      .limit(1);
    
    let userId = null;
    
    if (existingUsers && existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log('✅ Found existing user:', ADMIN_EMAIL);
    } else {
      // User doesn't exist yet - they need to sign up first
      console.log('⚠️  User not found in database.');
      console.log('📝 Please:');
      console.log('   1. Sign up at http://localhost:3000/signup with:', ADMIN_EMAIL);
      console.log('   2. Then run this script again');
      console.log('\nOr manually run this SQL in Supabase:');
      console.log(`UPDATE public.users SET is_admin = TRUE, subscription_active = TRUE WHERE email = '${ADMIN_EMAIL}';`);
      return;
    }
    
    // Update to admin
    const { error } = await supabase
      .from('users')
      .update({
        is_admin: true,
        subscription_active: true,
      })
      .eq('id', userId);
    
    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('\n✅ Admin privileges granted!');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log('   - Unlimited free stories');
      console.log('   - No payment required');
      console.log('   - Full access to all features');
      console.log('\n🎉 You can now create stories for free!');
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

setAdmin();

