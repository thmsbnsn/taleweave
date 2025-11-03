/**
 * Script to create or update an admin user
 * Usage: node scripts/create-admin.js <email>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

const adminEmail = process.argv[2] || 'admin@taleweave.com';

async function createAdmin() {
  console.log('👤 Setting up admin user...\n');
  
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    // First, check if user exists in auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching users:', authError.message);
      process.exit(1);
    }
    
    const existingUser = authUsers.users.find(u => u.email === adminEmail);
    
    if (!existingUser) {
      console.log(`⚠️  User with email ${adminEmail} not found in auth.users`);
      console.log('📝 Please sign up first with this email, then run this script again.');
      console.log('   Or provide an existing user email as argument:');
      console.log(`   node scripts/create-admin.js your@email.com\n`);
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${adminEmail}`);
    console.log(`   User ID: ${existingUser.id}\n`);
    
    // Update user in public.users table
    const { data: userRecord, error: updateError } = await supabase
      .from('users')
      .update({
        is_admin: true,
        subscription_active: true,
      })
      .eq('id', existingUser.id)
      .select()
      .single();
    
    if (updateError) {
      // If user doesn't exist in public.users, create it
      if (updateError.code === 'PGRST116') {
        console.log('📝 Creating user record in public.users...');
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: existingUser.id,
            email: adminEmail,
            is_admin: true,
            subscription_active: true,
          })
          .select()
          .single();
        
        if (createError) {
          console.error('❌ Error creating user:', createError.message);
          process.exit(1);
        }
        
        console.log('✅ Admin user created!');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Admin: Yes`);
        console.log(`   Subscription: Active (Free)`);
      } else {
        console.error('❌ Error updating user:', updateError.message);
        process.exit(1);
      }
    } else {
      console.log('✅ Admin user updated!');
      console.log(`   Email: ${userRecord.email || adminEmail}`);
      console.log(`   Admin: ${userRecord.is_admin ? 'Yes' : 'No'}`);
      console.log(`   Subscription: ${userRecord.subscription_active ? 'Active (Free)' : 'Inactive'}`);
    }
    
    console.log('\n🎉 Admin account is ready!');
    console.log('\n✨ Admin privileges:');
    console.log('   - Unlimited free story generation');
    console.log('   - No payment required');
    console.log('   - Full access to all features');
    console.log(`\n📧 Login with: ${adminEmail}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

createAdmin();

