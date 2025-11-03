# Fix Admin Access Issue

## Problem
Admin user set in database but still getting "no subscription" error.

## Possible Causes

1. **RLS Policy Issue**: Row Level Security might be blocking the query
2. **User ID Mismatch**: The user ID in auth doesn't match the database
3. **Data Type Issue**: Boolean values not being read correctly

## Quick Fix: Verify in Supabase

1. Go to Supabase Dashboard → Table Editor → `users` table
2. Find your user record
3. Verify:
   - `is_admin` is checked/TRUE (not just has value)
   - `subscription_active` is checked/TRUE if you want subscription access
   - `id` matches your auth user ID

## Check Auth User ID

1. In your browser console (F12), run:
```javascript
// This will show your user ID
fetch('/api/debug-user').then(r => r.json()).then(console.log)
```

Or check Vercel logs to see what user ID is being checked.

## SQL to Verify Your Account

Run this in Supabase SQL Editor:

```sql
-- Check your user account
SELECT id, email, is_admin, subscription_active 
FROM public.users 
WHERE email = 'your-email@example.com';

-- If you need to manually set admin (replace with your email)
UPDATE public.users 
SET is_admin = TRUE, subscription_active = TRUE 
WHERE email = 'your-email@example.com';
```

## Debug Steps

1. Check Vercel function logs when you try to create a story
2. Look for the console.log messages we added
3. Verify the user ID matches between auth and database
4. Check if RLS policies are blocking the query

## Test RLS Access

The query uses `auth.uid()` to check access. Make sure:
- You're properly authenticated (cookies set)
- The auth user ID matches the database user ID

## Temporary Workaround

If needed, we can use the service role key to bypass RLS for the check (less secure but works).

