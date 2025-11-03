# Fix CAPTCHA Verification Error

## Quick Fix: Disable CAPTCHA in Supabase

The CAPTCHA verification error can be fixed by disabling CAPTCHA in your Supabase project settings.

### Steps:

1. **Go to Supabase Dashboard**:
   https://supabase.com/dashboard/project/bkwivsskmyexflakxyzf/auth/providers

2. **Click on "Email" provider** (should be enabled)

3. **Look for "Enable CAPTCHA protection"** toggle
   - Turn it **OFF**
   - Save changes

4. **Alternative: Disable Email Confirmation**
   - Go to: Authentication > Settings
   - Find "Enable email confirmations"
   - Turn it **OFF** (for development/testing)
   - Save changes

5. **Try signing up again** - CAPTCHA should no longer be required

## Why This Happens

Supabase uses CAPTCHA by default to prevent spam signups. For development and testing, you can safely disable it. For production, you can:
- Keep it enabled for security
- Use reCAPTCHA v3 (less intrusive)
- Use other anti-spam measures

## After Disabling

Once CAPTCHA is disabled, signup should work immediately without verification errors.

## Alternative: Create User Manually

If you want to skip signup entirely for testing:

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add user" > "Create new user"
3. Enter email and password
4. Then run admin setup script

