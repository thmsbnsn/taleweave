# Database Schema Setup Instructions

## Quick Method

Run this command to open the SQL Editor:

```bash
npm run run:schema
```

Or manually:

1. **Open SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/bkwivsskmyexflakxyzf/sql

2. **Create New Query**:
   - Click the "New query" button (top right)

3. **Copy Schema**:
   - Open `database/schema.sql` in your project
   - Select all (Ctrl+A / Cmd+A)
   - Copy (Ctrl+C / Cmd+C)

4. **Paste and Run**:
   - Paste into the SQL editor
   - Click "Run" button (or press Ctrl+Enter / Cmd+Enter)

5. **Verify**:
   - Wait for "Success" message
   - Check that no errors appear

## What Gets Created

The schema creates:

### Tables:
- ✅ `users` - User profiles with subscription info
- ✅ `stories` - Generated stories
- ✅ `story_pages` - Individual story pages with images
- ✅ `user_credits` - Credits for one-time purchases

### Security:
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Triggers for auto-creating user profiles

### Storage:
- ✅ `story-images` bucket
- ✅ `story-audio` bucket
- ✅ Storage policies

## Verification

After running the schema, verify in Supabase dashboard:

1. **Tables**: Go to Table Editor - should see 4 tables
2. **Storage**: Go to Storage - should see 2 buckets
3. **Policies**: Go to Authentication > Policies - should see RLS policies

## Troubleshooting

If you see errors:
- "already exists" - Safe to ignore, means it's already set up
- "permission denied" - Check that you're using the service role key
- "relation does not exist" - Some dependencies may need to be created first

The schema is idempotent - safe to run multiple times!

