# Admin Account Setup

## Quick Setup

### Option 1: Automatic (Recommended)

1. **Sign up with your admin email** (or use an existing account)
   - Go to: http://localhost:3000/signup
   - Sign up with email you want to use as admin (e.g., `admin@taleweave.com`)

2. **Run the admin setup script**:
   ```bash
   node scripts/create-admin.js your@email.com
   ```
   Or use default:
   ```bash
   node scripts/create-admin.js
   ```
   (Uses `admin@taleweave.com` by default)

### Option 2: Manual SQL

Run this SQL in Supabase SQL Editor:

```sql
-- Add admin column if not exists (already in schema)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Set your email as admin (replace with your actual email)
UPDATE public.users 
SET is_admin = TRUE, subscription_active = TRUE 
WHERE email = 'your@email.com';
```

## Admin Privileges

Once set up, admin accounts have:
- ✅ **Unlimited free story generation** (no payment required)
- ✅ **Active subscription status** (always enabled)
- ✅ **Full access** to all features
- ✅ **No credit deduction** when creating stories

## Verify Admin Status

Check if a user is admin:

1. Go to Supabase Dashboard > Table Editor > `users`
2. Find your user by email
3. Check that `is_admin` = `true` and `subscription_active` = `true`

## Test Admin Access

1. Log in with your admin account
2. Go to `/create` page
3. Create a story - it should work without requiring payment!

## Remove Admin

To remove admin privileges:

```sql
UPDATE public.users 
SET is_admin = FALSE 
WHERE email = 'your@email.com';
```

Or use the script:
```bash
node scripts/remove-admin.js your@email.com
```

## Notes

- Admin status is checked before payment/subscription checks
- Admins bypass all payment requirements
- Make sure to use a secure email for your admin account
- You can have multiple admin accounts

