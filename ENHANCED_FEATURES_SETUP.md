# Enhanced Features Setup Guide

## ✅ What's Been Implemented

### 1. **Email Integration (Resend)**

#### **Email Service:** Resend
- ✅ Installed `resend` package
- ✅ Created `lib/email.ts` with email functions
- ✅ Co-parent invitation emails (automatically sent)
- ✅ Child account creation confirmation emails

#### **Email Templates:**
- **Co-Parent Invitation:** Beautiful HTML email with invitation link
- **Child Account Created:** Welcome email with login instructions

#### **Setup Required:**
1. Sign up at [resend.com](https://resend.com) (free tier: 3,000 emails/month)
2. Get your API key
3. Add to `.env.local`:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   ```
4. Update sender email in `lib/email.ts`:
   - Change `invites@taleweave.com` to your verified domain
   - Or use Resend's default sender for testing

#### **Current Behavior:**
- If `RESEND_API_KEY` not set, emails are skipped (gracefully)
- Invitation links are still returned to parent for manual sharing
- All email functions are lazy-loaded to prevent build errors

---

### 2. **Enhanced Child Profiles**

#### **Database Schema** (`database/enhanced-profiles-migration.sql`):
- ✅ `avatar_url` column in `users` table
- ✅ `favorite_color` column
- ✅ `preferences` JSONB column
- ✅ `child_preferences` table with:
  - `interests` (array)
  - `favorite_subjects` (array)
  - `learning_style` (visual, auditory, kinesthetic, mixed)
  - `difficulty_preference` (easy, medium, challenging)
  - `theme_preferences` (JSONB)

#### **API Routes:**
- ✅ `GET/PATCH /api/children/[id]/profile` - Get/update child profile
- ✅ `POST /api/children/[id]/avatar` - Upload avatar image

#### **Components:**
- ✅ `ChildProfileEditor` component with:
  - Avatar upload (image file, max 5MB)
  - Display name editing
  - Favorite color picker
  - Interests (comma-separated)
  - Favorite subjects
  - Learning style selector
  - Difficulty preference

#### **Parent Dashboard Integration:**
- ✅ "Edit Profile" button for each child
- ✅ Full profile editor modal/section
- ✅ Avatar preview
- ✅ All preferences saved to database

---

### 3. **Parent Roles & Permissions System**

#### **Database Schema** (`database/enhanced-profiles-migration.sql`):
- ✅ `role` column in `parent_children` table:
  - `primary_parent` - Full access (created child)
  - `co_parent` - Full or limited access (invited)
  - `guardian` - Read-only access
- ✅ `permissions` JSONB column with granular permissions:
  - `can_manage_access` - App lock toggle
  - `can_create_stories` - Create stories for child
  - `can_view_progress` - View learning progress
  - `can_manage_characters` - Edit profile/characters
  - `can_invite_others` - Invite more co-parents
  - `can_remove_children` - Remove child account

#### **Helper Function:**
- ✅ `check_parent_permission()` - SQL function to check permissions

#### **API Routes:**
- ✅ `GET /api/parents/roles?childId=xxx` - Get all parents for a child
- ✅ `PATCH /api/parents/roles` - Update parent role/permissions

#### **Parent Dashboard Integration:**
- ✅ Role badge display (Primary Parent, Co-Parent, Guardian)
- ✅ Permission-based UI:
  - Guardians cannot toggle app lock
  - Only primary parent can invite others
  - Only primary parent can manage roles
- ✅ Role management section:
  - View all parents for selected child
  - Change roles (Co-Parent ↔ Guardian)
  - See permission badges
  - Primary parent cannot be changed

---

## 🚀 Setup Instructions

### **Step 1: Run Database Migration**

1. Open Supabase SQL Editor
2. Copy/paste contents of `database/enhanced-profiles-migration.sql`
3. Execute
4. Verify:
   - `users` table has `avatar_url`, `favorite_color`, `preferences`
   - `child_preferences` table exists
   - `parent_children` has `role` and `permissions` columns

### **Step 2: Set Up Email (Optional but Recommended)**

1. **Sign up for Resend:**
   - Go to [resend.com](https://resend.com)
   - Create free account (3,000 emails/month)
   - Get API key from dashboard

2. **Add to `.env.local`:**
   ```env
   RESEND_API_KEY=re_your_api_key_here
   ```

3. **Verify Domain (Production):**
   - Add your domain in Resend dashboard
   - Update sender email in `lib/email.ts`:
     ```typescript
     from: 'TaleWeave <noreply@yourdomain.com>',
     ```

4. **For Testing:**
   - Can use Resend's default sender for development
   - Or leave unset to disable emails (invitation links still work)

### **Step 3: Test the Features**

1. **Child Profile:**
   - Go to `/parent`
   - Select a child
   - Click "Edit Profile"
   - Upload avatar, set preferences
   - Save

2. **Role Management:**
   - As primary parent, select child
   - Click "Manage Roles"
   - See all parents
   - Change co-parent to guardian (or vice versa)

3. **Email Invitations:**
   - Invite co-parent (should send email automatically)
   - Check email inbox for invitation
   - If email fails, invitation link is still returned

---

## 📊 Role Permissions Matrix

| Permission | Primary Parent | Co-Parent | Guardian |
|-----------|---------------|-----------|----------|
| Manage Access | ✅ | ✅ | ❌ |
| Create Stories | ✅ | ✅ | ✅ |
| View Progress | ✅ | ✅ | ✅ |
| Manage Characters | ✅ | ✅ | ✅ |
| Invite Others | ✅ | ❌ | ❌ |
| Remove Children | ✅ | ❌ | ❌ |
| Change Roles | ✅ | ❌ | ❌ |

**Note:** Primary parent has ALL permissions by default. Co-parent and Guardian permissions are configurable via `permissions` JSONB.

---

## 🎨 Child Profile Features

### **Avatar:**
- Upload image (JPG, PNG, GIF)
- Max 5MB file size
- Stored in Supabase `story-images` bucket
- Preview before upload

### **Preferences:**
- **Interests:** Comma-separated (e.g., "dinosaurs, space, princesses")
- **Favorite Subjects:** Comma-separated (e.g., "math, reading")
- **Learning Style:** Visual, Auditory, Kinesthetic, or Mixed
- **Difficulty Preference:** Easy, Medium, or Challenging

### **Use Cases:**
- Preferences can inform story generation (interests)
- Learning style can adjust quiz presentation
- Difficulty preference for adaptive learning
- Favorite color for UI customization

---

## 🔐 Security & Permissions

### **Permission Checking:**
- All API routes verify parent access
- Permission checks before sensitive operations
- RLS policies enforce database-level security

### **Role Hierarchy:**
1. **Primary Parent:** Created account, can do everything
2. **Co-Parent:** Full access (default) or limited (configurable)
3. **Guardian:** Read-only (cannot modify settings)

### **Guardian Use Cases:**
- Grandparents who want to view progress
- Babysitters who need limited access
- Teachers or tutors monitoring learning

---

## 🐛 Known Limitations / TODOs

1. **Email Domain Verification:**
   - Currently uses placeholder domain
   - Need to verify domain in Resend for production
   - Can use default sender for development

2. **Avatar Storage:**
   - Currently uses `story-images` bucket
   - Could create dedicated `avatars` bucket

3. **Permission Granularity:**
   - Currently role-based (primary/co/guardian)
   - Could add more granular permission controls
   - Could add custom permission sets

4. **Profile Sync:**
   - Profile updates might not reflect immediately
   - Could add optimistic updates or real-time sync

5. **Role Transfer:**
   - Cannot transfer primary parent role yet
   - Could add "Transfer Primary Parent" feature

---

## 📝 Files Created/Modified

### **New Files:**
- `lib/email.ts` - Email service (Resend)
- `app/api/children/[id]/profile/route.ts` - Profile API
- `app/api/children/[id]/avatar/route.ts` - Avatar upload API
- `app/api/parents/roles/route.ts` - Role management API
- `components/ChildProfileEditor.tsx` - Profile editor component
- `database/enhanced-profiles-migration.sql` - Database migration

### **Modified Files:**
- `app/parent/page.tsx` - Added profile editor, role management
- `app/api/parents/invite/route.ts` - Email integration
- `app/api/children/create/route.ts` - Email confirmation
- `app/api/parents/accept-invite/route.ts` - Default permissions
- `package.json` - Added `resend` dependency

---

## ✅ Testing Checklist

- [ ] Run database migration
- [ ] Set `RESEND_API_KEY` (optional)
- [ ] Create child account → Check for email
- [ ] Edit child profile → Upload avatar → Verify save
- [ ] Invite co-parent → Check for invitation email
- [ ] Accept invitation → Verify role assignment
- [ ] Test role management (primary parent only)
- [ ] Test permission restrictions (guardian cannot lock/unlock)
- [ ] Verify avatar displays in child list
- [ ] Check that preferences are saved and loaded

---

## 🎉 Benefits

- ✅ **Automatic Email Invitations** - No manual link sharing needed
- ✅ **Rich Child Profiles** - Avatars, colors, preferences for personalization
- ✅ **Flexible Permissions** - Support for various family structures
- ✅ **Role-Based Access** - Guardian mode for grandparents/teachers
- ✅ **Co-Parent Friendly** - Both parents have full access (by default)

**Everything is ready to use! Just run the migration and set up Resend!** 🚀

