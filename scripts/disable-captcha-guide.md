# How to Disable CAPTCHA in Supabase

## Quick Steps

1. **Go to Supabase Dashboard**:
   https://supabase.com/dashboard/project/bkwivsskmyexflakxyzf/auth/providers

2. **Click on "Email" provider**

3. **Look for CAPTCHA settings**:
   - Find "Enable CAPTCHA protection" toggle
   - Turn it OFF for development
   - Save changes

4. **Alternative - Disable Email Confirmation**:
   - Go to: Authentication > Settings
   - Find "Enable email confirmations"
   - Turn it OFF (this may also bypass CAPTCHA)
   - Save changes

5. **Try signing up again**

## Alternative: Use Magic Link Authentication

Magic links don't require CAPTCHA. I can update the signup flow to use magic links instead if you prefer.

## Testing Without Signup

For testing, you can also:
1. Create a user directly in Supabase Dashboard
2. Set them as admin via SQL
3. Login with that account

Let me know which approach you'd like to use!

